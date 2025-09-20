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
    from_port   = 5173
    to_port     = 5173
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

variable "sg_name" {}
variable "vpc_id" {}
variable "tags" {
  type = map(string)
}
