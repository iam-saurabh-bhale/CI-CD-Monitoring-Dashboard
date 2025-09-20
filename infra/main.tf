provider "aws" {
  region = "us-east-1" # change as per your region
}

module "vpc" {
  source = "./modules/vpc"
  vpc_cidr = "10.0.0.0/16"
  subnet_cidr = "10.0.1.0/24"
  tags = {
    task = "assignment3"
    Name = "assignment3 network"
  }
}

module "keypair" {
  source     = "./modules/keypair"
  key_name   = "assignment3-pem"
  tags = {
    task = "assignment3"
    Name = "assignment3-key"
  }
}

module "security_group" {
  source = "./modules/security-group"
  vpc_id = module.vpc.vpc_id
  sg_name = "assignment3-SG"
  tags = {
    task = "assignment3"
    Name = "assignment3 SG"
  }
}

module "ec2" {
  source = "./modules/ec2"
  ami_id = "ami-08982f1c5bf93d976" # Amazon Linux 2 AMI (ap-south-1)
  instance_type = "t2.micro"
  subnet_id = module.vpc.subnet_id
  sg_id     = module.security_group.sg_id
  key_name  = module.keypair.key_name
  tags = {
    task = "assignment3"
    Name = "assignment 3 instance"
  }
}
