#!/usr/bin/env bash
# EventFlow — AWS deploy script
# Usage: ./infra/deploy.sh

set -euo pipefail

AWS_REGION="${AWS_REGION:-us-east-1}"
STACK_NAME="eventflow"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_URI="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/eventflow-backend"

echo "▶ Account: ${ACCOUNT_ID}  Region: ${AWS_REGION}"

# ── Phase 1: Deploy infrastructure WITHOUT ECS service (DesiredCount=0)
# This creates DDB, S3, ECR, IAM roles, ALB — but starts 0 tasks
echo "▶ Phase 1: Deploying infrastructure (no ECS tasks yet)..."
aws cloudformation deploy \
  --template-file infra/cloudformation.yaml \
  --stack-name "${STACK_NAME}" \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    VpcId="${VPC_ID:?Set VPC_ID env var}" \
    PublicSubnetIds="${SUBNET_IDS:?Set SUBNET_IDS env var (comma-separated)}" \
    JwtSecret="${JWT_SECRET:?Set JWT_SECRET env var}" \
    FrontendUrl="${FRONTEND_URL:-http://localhost:3000}" \
    EcrImageUri="${ECR_URI}:latest" \
    DesiredCount=0 \
  --no-fail-on-empty-changeset

# ── Phase 2: Build & push Docker image (AMD64 for Fargate)
echo "▶ Phase 2: Logging in to ECR..."
aws ecr get-login-password --region "${AWS_REGION}" \
  | docker login --username AWS --password-stdin "${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

echo "▶ Building Docker image (linux/amd64)..."
docker build --platform linux/amd64 -t eventflow-backend ./backend

echo "▶ Tagging & pushing..."
docker tag eventflow-backend:latest "${ECR_URI}:latest"
docker push "${ECR_URI}:latest"

# ── Phase 3: Scale ECS service up to 1 now that image exists
echo "▶ Phase 3: Scaling ECS service to 1..."
aws ecs update-service \
  --cluster eventflow \
  --service eventflow-backend \
  --desired-count 1 \
  --force-new-deployment \
  --region "${AWS_REGION}" \
  --output text --query 'service.serviceName'

echo "▶ Waiting for service to stabilize (up to 5 min)..."
aws ecs wait services-stable \
  --cluster eventflow \
  --services eventflow-backend \
  --region "${AWS_REGION}"

# ── Print backend URL
BACKEND_URL=$(aws cloudformation describe-stacks \
  --stack-name "${STACK_NAME}" \
  --query "Stacks[0].Outputs[?OutputKey=='BackendUrl'].OutputValue" \
  --output text)

echo ""
echo "✅  Deploy complete!"
echo "   Backend API : ${BACKEND_URL}"
echo "   Set NEXT_PUBLIC_API_URL=${BACKEND_URL} in your Amplify environment"
