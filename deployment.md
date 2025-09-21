# Deployment Guide – Terraform Assignment 3

## 1. Prerequisites

- Install **Terraform**: [Download here](https://developer.hashicorp.com/terraform/downloads)
- Install **AWS CLI**: [Download here](https://aws.amazon.com/cli/)
- Configure AWS credentials:

```bash
aws configure
```

Provide:  
- Setup the AWS key on local  
- Region (e.g., `us-east-1`)  
- Output format (e.g., `json`)  

---

## 2. Project Setup

Navigate into your project folder:

```bash
cd terraform-assignment3
```

Check the structure:

```
infra/
├── main.tf
├── variables.tf
├── outputs.tf
└── modules/
    ├── vpc/
    │   └── main.tf
    ├── keypair/
    │   └── main.tf
    ├── security-group/
    │   └── main.tf
    └── ec2/
        └── main.tf
```

---

## 3. Initialize Terraform

Run:

```bash
terraform init
```

👉 This downloads AWS provider & sets up modules.

---

## 4. Validate the Code

```bash
terraform validate
```

👉 Checks if configuration is syntactically correct.

---

## 5. Preview Changes

```bash
terraform plan
```

👉 Shows what Terraform will create:

- VPC, Subnet, IGW, Route table  
- Key Pair (`assignment3-pem.pem`)  
- Security Group (`assignment3-SG`)  
- EC2 Instance (`assignment 3 instance`)  

---

## 6. Apply the Configuration

```bash
terraform apply
```

When prompted, type `yes`.  
👉 Terraform will create all resources.

---

## 7. Verify Resources

- List VPCs:

```bash
aws ec2 describe-vpcs --query "Vpcs[*].VpcId"
```

- List EC2:

```bash
aws ec2 describe-instances --query "Reservations[*].Instances[*].[InstanceId,State.Name,PublicIpAddress,Tags]"
```

- The PEM file will be saved locally in your working directory (`assignment3-pem.pem`).

Set correct permissions:

```bash
chmod 400 assignment3-pem.pem
```

---

## 8. Connect to EC2 / Deploy Application

Use SSH manually or **GitHub Actions** automation.

### Add the following environment variables in GitHub Secrets:
- `EC2_SSH_KEY`
- `EC2_HOST`

### GitHub Actions Workflow

```yaml
name: Deploy to EC2 with Docker Compose

on:
  workflow_dispatch: # 👈 Manual trigger

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Install SSH Client
        run: sudo apt-get update && sudo apt-get install -y openssh-client

      - name: Connect to EC2 and Deploy
        run: |
          echo "${{ secrets.EC2_SSH_KEY }}" > ec2_key.pem
          chmod 600 ec2_key.pem

          ssh -T -o StrictHostKeyChecking=no -i ec2_key.pem ec2-user@${{ secrets.EC2_HOST }} << 'EOF'
          set -e

          # 1) Update system and install Docker if not installed
          if ! command -v docker &> /dev/null
          then
            echo "Docker not found. Installing..."
            sudo yum update -y
            sudo amazon-linux-extras install docker -y || sudo yum install docker -y
            sudo systemctl start docker
            sudo systemctl enable docker
          else
            echo "Docker already installed."
          fi

          # Install Docker Compose if not present
          if ! command -v docker-compose &> /dev/null
          then
            echo "Installing Docker Compose..."
            sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
            sudo chmod +x /usr/local/bin/docker-compose
          else
            echo "Docker Compose already installed."
          fi

          # 2) Install git if not present
          if ! command -v git &> /dev/null
          then
            echo "Installing Git..."
            sudo yum install -y git
          else
            echo "Git already installed."
          fi

          # 3) Remove old repo if exists, then clone latest
          if [ -d "CI-CD-Monitoring-Dashboard" ]; then
            echo "Removing old repo..."
            sudo rm -rf CI-CD-Monitoring-Dashboard
          fi
          git clone https://github.com/iam-saurabh-bhale/CI-CD-Monitoring-Dashboard.git

          cd CI-CD-Monitoring-Dashboard/assignment2/.github-actions-dashboard

          # 4) Stop and remove all containers + images
          echo "Cleaning up old containers and images..."
          sudo docker ps -aq | xargs -r sudo docker stop
          sudo docker ps -aq | xargs -r sudo docker rm
          sudo docker images -q | xargs -r sudo docker rmi -f

          # 5) Start containers with docker-compose
          echo "Starting new containers..."
          sudo docker-compose up -d --build

          # 6) Wait 15s and verify 3 containers running
          echo "Waiting 15 seconds for containers to start..."
          sleep 15
          RUNNING=$(sudo docker ps -q | wc -l)

          if [ "$RUNNING" -eq 3 ]; then
            echo "✅ Success: All 3 containers are running."
            exit 0
          else
            echo "❌ Error: Expected 3 containers, but found $RUNNING."
            exit 1
          fi
          EOF
```

---

## 9. Destroy Resources

```bash
terraform destroy
```

👉 This will remove all created infrastructure.

---

## ✅ Summary

1. Prerequisites  
2. Project Setup  
3. Initialize Terraform  
4. Validate the Code  
5. Preview Changes  
6. Apply the Configuration  
7. Verify Resources  
8. Deploy Application via SSH/GitHub Actions  
9. Destroy Resources  
