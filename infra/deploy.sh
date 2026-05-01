#!/usr/bin/env bash
# EventFlow deploy script — backend + frontend on one ALB
set -euo pipefail

AWS_REGION="${AWS_REGION:-us-east-1}"
STACK_NAME="eventflow"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
BACKEND_ECR="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/eventflow-backend"
FRONTEND_ECR="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/eventflow-frontend"

echo "▶ Account: ${ACCOUNT_ID}  Region: ${AWS_REGION}"

# ── Phase 1: infrastructure with DesiredCount=0 (no tasks start yet)
echo "▶ Phase 1: Deploying infrastructure..."
aws cloudformation deploy \
  --template-file infra/cloudformation.yaml \
  --stack-name "${STACK_NAME}" \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    VpcId="${VPC_ID:?Set VPC_ID}" \
    PublicSubnetIds="${SUBNET_IDS:?Set SUBNET_IDS}" \
    JwtSecret="${JWT_SECRET:?Set JWT_SECRET}" \
    BackendDesiredCount=0 \
    FrontendDesiredCount=0 \
  --no-fail-on-empty-changeset

# ── Phase 2: build & push images
echo "▶ Phase 2: Logging in to ECR..."
aws ecr get-login-password --region "${AWS_REGION}" \
  | docker login --username AWS --password-stdin "${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

echo "▶ Building backend (linux/amd64)..."
docker build --platform linux/amd64 -t eventflow-backend ./backend
docker tag eventflow-backend:latest "${BACKEND_ECR}:latest"
docker push "${BACKEND_ECR}:latest"

echo "▶ Building frontend (linux/amd64)..."
docker build --platform linux/amd64 \
  --build-arg NEXT_PUBLIC_API_URL=/api \
  -t eventflow-frontend ./frontend
docker tag eventflow-frontend:latest "${FRONTEND_ECR}:latest"
docker push "${FRONTEND_ECR}:latest"

# ── Phase 3: scale up
echo "▶ Phase 3: Scaling up services..."
aws ecs update-service --cluster eventflow --service eventflow-backend \
  --desired-count 1 --force-new-deployment \
  --region "${AWS_REGION}" --output text --query 'service.serviceName'

aws ecs update-service --cluster eventflow --service eventflow-frontend \
  --desired-count 1 --force-new-deployment \
  --region "${AWS_REGION}" --output text --query 'service.serviceName'

echo "▶ Waiting for services to stabilize (up to 10 min)..."
aws ecs wait services-stable \
  --cluster eventflow \
  --services eventflow-backend eventflow-frontend \
  --region "${AWS_REGION}"

APP_URL=$(aws cloudformation describe-stacks \
  --stack-name "${STACK_NAME}" \
  --query "Stacks[0].Outputs[?OutputKey=='AppUrl'].OutputValue" \
  --output text)

echo ""
echo "✅  Deploy complete!"
echo "   App : ${APP_URL}"
echo "   API : ${APP_URL}/api"
