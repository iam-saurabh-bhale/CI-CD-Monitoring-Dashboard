Terraform code example
user
You are the terraform devloper and you need to write the code for below 
1) Create VPC with one subnet with /24 range of subnet with routes and internet gateway added it.
2) Create the PEM key named assigment3-pem
3) Created Security group with name assignemt3-SG and keep the port 80 and port 22 open to all 0.0.0.0/0
4) please create one Ec2 instance and use the subnet, Pem key and security group created above

Please use the module approch for all this tasks and provide me the code.

Cloud provider : AWS 
All resources should have tag of taks : assignment3

Name of Ec2 Is assignment 3 instance.

ChatGPT
Got it ✅. I’ll create a **modular Terraform setup** for your requirements.  
The structure will look like this:

```
assignment3/
├── main.tf
├── variables.tf
├── outputs.tf
├── modules/
│   ├── vpc/
│   │   └── main.tf
│   ├── keypair/
│   │   └── main.tf
│   ├── security-group/
│   │   └── main.tf
│   └── ec2/
│       └── main.tf
```

Here’s the full code 👇

---

### `main.tf`
```hcl
provider "aws" {
  region = "ap-south-1" # change as per your region
}

module "vpc" {
  source = "./modules/vpc"
  vpc_cidr = "10.0.0.0/16"
  subnet_cidr = "10.0.1.0/24"
  tags = {
    task = "assignment3"
  }
}

module "keypair" {
  source     = "./modules/keypair"
  key_name   = "assignment3-pem"
  public_key = file("~/.ssh/id_rsa.pub") # replace with your public key path
  tags = {
    task = "assignment3"
  }
}

module "security_group" {
  source = "./modules/security-group"
  vpc_id = module.vpc.vpc_id
  sg_name = "assignment3-SG"
  tags = {
    task = "assignment3"
  }
}

module "ec2" {
  source = "./modules/ec2"
  ami_id = "ami-0dee22c13ea7a9a67" # Amazon Linux 2 AMI (example for ap-south-1)
  instance_type = "t2.micro"
  subnet_id = module.vpc.subnet_id
  sg_id     = module.security_group.sg_id
  key_name  = module.keypair.key_name
  tags = {
    task = "assignment3"
    Name = "assignment 3 instance"
  }
}
```

---

### `modules/vpc/main.tf`
```hcl
resource "aws_vpc" "this" {
  cidr_block = var.vpc_cidr
  tags       = var.tags
}

resource "aws_internet_gateway" "this" {
  vpc_id = aws_vpc.this.id
  tags   = var.tags
}

resource "aws_subnet" "this" {
  vpc_id            = aws_vpc.this.id
  cidr_block        = var.subnet_cidr
  availability_zone = data.aws_availability_zones.available.names[0]
  tags              = var.tags
}

resource "aws_route_table" "this" {
  vpc_id = aws_vpc.this.id
  tags   = var.tags
}

resource "aws_route" "internet_access" {
  route_table_id         = aws_route_table.this.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.this.id
}

resource "aws_route_table_association" "a" {
  subnet_id      = aws_subnet.this.id
  route_table_id = aws_route_table.this.id
}

data "aws_availability_zones" "available" {}

output "vpc_id" {
  value = aws_vpc.this.id
}

output "subnet_id" {
  value = aws_subnet.this.id
}
```

---

### `modules/keypair/main.tf`
```hcl
resource "aws_key_pair" "this" {
  key_name   = var.key_name
  public_key = var.public_key
  tags       = var.tags
}

output "key_name" {
  value = aws_key_pair.this.key_name
}
```

---

### `modules/security-group/main.tf`
```hcl
resource "aws_security_group" "this" {
  name        = var.sg_name
  description = "Assignment3 SG allowing SSH and HTTP"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = var.tags
}

output "sg_id" {
  value = aws_security_group.this.id
}
```

---

### `modules/ec2/main.tf`
```hcl
resource "aws_instance" "this" {
  ami           = var.ami_id
  instance_type = var.instance_type
  subnet_id     = var.subnet_id
  vpc_security_group_ids = [var.sg_id]
  key_name      = var.key_name

  tags = var.tags
}

output "instance_id" {
  value = aws_instance.this.id
}
```

---

### `variables.tf`
```hcl
variable "region" {
  default = "ap-south-1"
}
```

---

This setup:
- Creates **VPC + subnet + IGW + route table**  
- Creates **Key Pair (assignment3-pem)**  
- Creates **SG (assignment3-SG) with port 22 & 80 open to 0.0.0.0/8**  
- Launches **EC2 instance** with the above resources  

---

👉 Do you want me to also add **code to save the PEM file locally** (private key) instead of using your existing `~/.ssh/id_rsa.pub`? That way, Terraform itself will generate and store it for you.
user
Yes
ChatGPT
Perfect 👍  
We’ll update the **Key Pair module** so Terraform will **generate a new private/public key pair**, upload the public key to AWS, and save the private key (`assignment3.pem`) **locally**.  

Here’s the updated setup:

---

### `modules/keypair/main.tf`
```hcl
resource "tls_private_key" "this" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "this" {
  key_name   = var.key_name
  public_key = tls_private_key.this.public_key_openssh
  tags       = var.tags
}

# Save private key locally as PEM file
resource "local_file" "pem_file" {
  content  = tls_private_key.this.private_key_pem
  filename = "${path.module}/../../${var.key_name}.pem"
}

output "key_name" {
  value = aws_key_pair.this.key_name
}
```

---

### `modules/keypair/variables.tf`
```hcl
variable "key_name" {
  description = "Key pair name"
}

variable "tags" {
  type        = map(string)
  description = "Tags to apply to resources"
  default     = {}
}
```

---

Now, when you run:

```bash
terraform init
terraform apply -auto-approve
```

It will:  
✅ Generate a new **RSA 4096-bit key**  
✅ Upload the **public key** to AWS as `assignment3-pem`  
✅ Save the **private key** in the root directory as `assignment3.pem` (same level as your `main.tf`)  

---

⚠️ After apply, don’t forget to set permissions so you can use it with SSH:

```bash
chmod 400 assignment3.pem
```

---

👉 Do you want me to also update the **EC2 module** so Terraform automatically outputs the **public IP** of the instance for easy SSH login?
user
yes
ChatGPT
Great 👍 Let’s enhance the **EC2 module** so that after `terraform apply`, you’ll directly see:  

- EC2 **instance ID**  
- EC2 **public IP**  
- Suggested **SSH command**  

---

### `modules/ec2/main.tf`
```hcl
resource "aws_instance" "this" {
  ami                    = var.ami_id
  instance_type          = var.instance_type
  subnet_id              = var.subnet_id
  vpc_security_group_ids = [var.sg_id]
  key_name               = var.key_name
  associate_public_ip_address = true

  tags = var.tags
}

output "instance_id" {
  value = aws_instance.this.id
}

output "public_ip" {
  value = aws_instance.this.public_ip
}

output "ssh_command" {
  value = "ssh -i ${var.key_name}.pem ec2-user@${aws_instance.this.public_ip}"
}
```

---

### Example Output after `terraform apply`
```bash
Outputs:

ec2_instance_id = "i-0abcd1234efgh5678"
ec2_public_ip   = "13.235.xxx.xxx"
ssh_command     = "ssh -i assignment3.pem ec2-user@13.235.xxx.xxx"
```

---

🔑 Now you can copy-paste the `ssh_command` output and log in directly to your instance.  

👉 Do you also want me to add **user_data** (e.g., install Apache, Nginx, or Docker automatically on boot), or should we keep it a clean instance?
user
no
ChatGPT
👌 Got it — we’ll keep the EC2 instance clean without any `user_data`.  

So now your Terraform setup will:  
- Create a **VPC, subnet, route table, and IGW**  
- Generate and save **assignment3.pem** locally  
- Create a **security group (assignment3-SG)** with ports **22 and 80 open to 0.0.0.0/8**  
- Launch an **EC2 instance** named *assignment 3 instance*  
- Output the **instance ID, public IP, and ready-to-use SSH command**  

---

⚡ Next steps for you after `terraform apply`:  

```bash
cd assignment3
terraform init
terraform apply -auto-approve
chmod 400 assignment3.pem
```

Then SSH into the instance using the output command:

```bash
ssh -i assignment3.pem ec2-user@<public-ip>
```

---

Would you like me to also create a **README.md** with step-by-step instructions so you (or anyone else) can reuse this setup easily?
user
please provide me the all details in zip file 
ChatGPT
I’ve packaged everything into a **ready-to-use Terraform project**.  
You can download it here:

📦 [assignment3_terraform.zip](sandbox:/mnt/data/assignment3_terraform.zip)

---

### Inside the ZIP:
- **main.tf** (calls all modules)  
- **variables.tf**  
- **modules/**  
  - `vpc` → VPC + subnet + IGW + route table  
  - `keypair` → Generates and saves `assignment3.pem` locally  
  - `security-group` → SG with SSH & HTTP open  
  - `ec2` → EC2 instance with outputs (ID, public IP, SSH command)  

---

After downloading:  
```bash
unzip assignment3_terraform.zip
cd assignment3
terraform init
terraform apply -auto-approve
chmod 400 assignment3.pem
```

Then SSH into your instance using the output command. 🚀  

Do you also want me to include a **README.md** inside the ZIP with these instructions for quick reference?

