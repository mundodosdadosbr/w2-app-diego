import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as iam from "aws-cdk-lib/aws-iam";
import * as budgets from "aws-cdk-lib/aws-budgets";
import * as sns from "aws-cdk-lib/aws-sns";
import * as snsSubs from "aws-cdk-lib/aws-sns-subscriptions";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";

export interface W2StackProps extends cdk.StackProps {
  /** "prod" ou "dev" — usado para sufixar nomes. */
  stage: "prod" | "dev";
  /** Email que recebe alertas de budget. Default: pula SNS. */
  alertEmail?: string;
  /** Limite mensal (USD) para alerta. Default: $15 (uso pessoal). */
  monthlyBudgetUsd?: number;
}

/**
 * Infra AWS do W2 App.
 * - S3 bucket `w2-stt-uploads`: staging de áudio antes de ir para Transcribe (TTL 7d).
 * - S3 bucket `w2-recordings`: áudio do aluno persistido (TTL 90d, LGPD).
 * - IAM user `w2-edge-function-runtime`: credenciais para Supabase Edge Functions.
 *   Policy mínima: Bedrock invoke (Claude whitelisted), Transcribe jobs, S3 nos dois buckets.
 *
 * Ver docs/adr/019-aws-auth.md + docs/use-cases/UC-03, UC-10.
 */
export class W2Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: W2StackProps) {
    super(scope, id, props);

    const stage = props.stage;
    const suffix = stage === "prod" ? "" : `-${stage}`;

    // ========================================================================
    // S3 — stt-uploads (staging 7d)
    // ========================================================================

    const sttBucket = new s3.Bucket(this, "SttUploadsBucket", {
      bucketName: `w2-stt-uploads${suffix}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true, // Best practice: bloqueia requests não-HTTPS
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED, // ACLs off (default moderno)
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: false,
      removalPolicy:
        stage === "prod"
          ? cdk.RemovalPolicy.RETAIN
          : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: stage !== "prod",
      lifecycleRules: [
        {
          id: "expire-stt-uploads",
          enabled: true,
          expiration: cdk.Duration.days(7),
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(1),
        },
      ],
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.PUT,
            s3.HttpMethods.GET,
            s3.HttpMethods.HEAD,
          ],
          allowedOrigins: ["*"], // Tighten em prod para domínio do app.
          allowedHeaders: ["*"],
          exposedHeaders: ["ETag"],
          maxAge: 3000,
        },
      ],
    });

    // ========================================================================
    // S3 — recordings (aluno 90d, defesa em profundidade sobre UC-10)
    // ========================================================================

    const recordingsBucket = new s3.Bucket(this, "RecordingsBucket", {
      bucketName: `w2-recordings${suffix}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: false,
      removalPolicy:
        stage === "prod"
          ? cdk.RemovalPolicy.RETAIN
          : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: stage !== "prod",
      lifecycleRules: [
        {
          id: "expire-recordings-90d",
          enabled: true,
          expiration: cdk.Duration.days(90),
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(1),
        },
      ],
    });

    // ========================================================================
    // IAM user — runtime para Edge Functions Supabase
    // ========================================================================

    const edgeUser = new iam.User(this, "EdgeFunctionRuntimeUser", {
      userName: `w2-edge-function-runtime${suffix}`,
    });

    // Bedrock — whitelist de modelos (ADR-017).
    edgeUser.addToPolicy(
      new iam.PolicyStatement({
        sid: "BedrockInvokeWhitelistedModels",
        actions: [
          "bedrock:InvokeModel",
          "bedrock:InvokeModelWithResponseStream",
          "bedrock:Converse",
          "bedrock:ConverseStream",
        ],
        resources: [
          // Anthropic Claude na região
          `arn:aws:bedrock:${this.region}::foundation-model/anthropic.claude-sonnet-4-*`,
          `arn:aws:bedrock:${this.region}::foundation-model/anthropic.claude-opus-4-*`,
          `arn:aws:bedrock:${this.region}::foundation-model/anthropic.claude-haiku-4-*`,
          // Cross-region inference profiles
          `arn:aws:bedrock:${this.region}:${this.account}:inference-profile/*`,
        ],
      }),
    );

    // Polly — síntese de voz (TTS, UC-08).
    edgeUser.addToPolicy(
      new iam.PolicyStatement({
        sid: "PollyTts",
        actions: ["polly:SynthesizeSpeech", "polly:DescribeVoices"],
        resources: ["*"],
      }),
    );

    // Transcribe — jobs + custom vocabulary (UC-03).
    edgeUser.addToPolicy(
      new iam.PolicyStatement({
        sid: "TranscribeJobs",
        actions: [
          "transcribe:StartTranscriptionJob",
          "transcribe:GetTranscriptionJob",
          "transcribe:ListTranscriptionJobs",
          "transcribe:DeleteTranscriptionJob",
          "transcribe:CreateVocabulary",
          "transcribe:UpdateVocabulary",
          "transcribe:GetVocabulary",
          "transcribe:DeleteVocabulary",
          "transcribe:ListVocabularies",
        ],
        resources: ["*"], // Transcribe exige *, sem ARN por recurso.
      }),
    );

    // S3 — restrito aos dois buckets do W2.
    sttBucket.grantReadWrite(edgeUser);
    recordingsBucket.grantReadWrite(edgeUser);

    // Presigned URLs (CORS uploads direto do cliente)
    edgeUser.addToPolicy(
      new iam.PolicyStatement({
        sid: "S3PresignedUrls",
        actions: ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
        resources: [
          `${sttBucket.bucketArn}/*`,
          `${recordingsBucket.bucketArn}/*`,
        ],
      }),
    );

    // ========================================================================
    // Access key + Secrets Manager (best practice: não dumpar secret em Output).
    // Secret guardado no Secrets Manager — você lê uma única vez via console ou CLI
    // e cola nos secrets do Supabase. Evita que qualquer read do CloudFormation
    // template exponha o secret.
    // ========================================================================

    const accessKey = new iam.CfnAccessKey(this, "EdgeFunctionAccessKey", {
      userName: edgeUser.userName,
      status: "Active",
    });

    const accessKeySecret = new secretsmanager.Secret(
      this,
      "EdgeFunctionAccessKeySecret",
      {
        secretName: `w2/edge-function/access-key${suffix}`,
        description:
          "AWS access key + secret do IAM user w2-edge-function-runtime. " +
          "Copie para Supabase secrets (AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY).",
        secretObjectValue: {
          AWS_ACCESS_KEY_ID: cdk.SecretValue.unsafePlainText(accessKey.ref),
          AWS_SECRET_ACCESS_KEY: cdk.SecretValue.unsafePlainText(
            accessKey.attrSecretAccessKey,
          ),
        },
        removalPolicy:
          stage === "prod"
            ? cdk.RemovalPolicy.RETAIN
            : cdk.RemovalPolicy.DESTROY,
      },
    );

    // ========================================================================
    // AWS Budgets: alerta por email em 80% e 100% do limite mensal.
    // Gratuito (2 budgets/conta). Ver docs/adr/012-observabilidade-e-analytics.md.
    // ========================================================================

    const budgetLimit = props.monthlyBudgetUsd ?? 15;
    const alertEmail = props.alertEmail;

    const subscribers: budgets.CfnBudget.SubscriberProperty[] = alertEmail
      ? [{ subscriptionType: "EMAIL", address: alertEmail }]
      : [];

    if (subscribers.length > 0) {
      new budgets.CfnBudget(this, "MonthlyBudget", {
        budget: {
          budgetName: `w2-monthly-budget${suffix}`,
          budgetType: "COST",
          timeUnit: "MONTHLY",
          budgetLimit: {
            amount: budgetLimit,
            unit: "USD",
          },
        },
        notificationsWithSubscribers: [
          {
            notification: {
              notificationType: "ACTUAL",
              comparisonOperator: "GREATER_THAN",
              threshold: 80,
              thresholdType: "PERCENTAGE",
            },
            subscribers,
          },
          {
            notification: {
              notificationType: "ACTUAL",
              comparisonOperator: "GREATER_THAN",
              threshold: 100,
              thresholdType: "PERCENTAGE",
            },
            subscribers,
          },
          {
            notification: {
              notificationType: "FORECASTED",
              comparisonOperator: "GREATER_THAN",
              threshold: 100,
              thresholdType: "PERCENTAGE",
            },
            subscribers,
          },
        ],
      });
    } else {
      // Sem email? Só cria o budget (sem notificação).
      new budgets.CfnBudget(this, "MonthlyBudget", {
        budget: {
          budgetName: `w2-monthly-budget${suffix}`,
          budgetType: "COST",
          timeUnit: "MONTHLY",
          budgetLimit: { amount: budgetLimit, unit: "USD" },
        },
      });
    }

    // Também reservamos um SNS topic para alertas futuros (Sentry, custom metrics).
    const alertTopic = new sns.Topic(this, "AlertTopic", {
      topicName: `w2-alerts${suffix}`,
      displayName: "W2 App — alertas operacionais",
    });
    if (alertEmail) {
      alertTopic.addSubscription(new snsSubs.EmailSubscription(alertEmail));
    }

    // ========================================================================
    // Outputs
    // ========================================================================

    new cdk.CfnOutput(this, "SttUploadsBucketName", {
      value: sttBucket.bucketName,
      description: "Bucket para staging de áudio STT (TTL 7d)",
    });

    new cdk.CfnOutput(this, "RecordingsBucketName", {
      value: recordingsBucket.bucketName,
      description: "Bucket para gravações de aluno (TTL 90d)",
    });

    new cdk.CfnOutput(this, "EdgeUserArn", {
      value: edgeUser.userArn,
      description: "IAM user para Edge Functions Supabase",
    });

    new cdk.CfnOutput(this, "AccessKeySecretArn", {
      value: accessKeySecret.secretArn,
      description:
        "ARN do Secrets Manager contendo AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY. " +
        "Leia via: aws secretsmanager get-secret-value --secret-id <ARN> --query SecretString --output text",
    });

    new cdk.CfnOutput(this, "Region", {
      value: this.region,
    });

    new cdk.CfnOutput(this, "MonthlyBudgetUsd", {
      value: `${budgetLimit}`,
      description:
        "Limite mensal de custos AWS. Alertas em 80%, 100% e forecast 100%.",
    });

    new cdk.CfnOutput(this, "AlertTopicArn", {
      value: alertTopic.topicArn,
      description:
        "SNS topic para alertas futuros (custom metrics, falhas, etc.)",
    });
  }
}
