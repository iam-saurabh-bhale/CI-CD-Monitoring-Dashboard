resource "tls_private_key" "this" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "this" {
  key_name   = var.key_name
  public_key = tls_private_key.this.public_key_openssh
  tags       = var.tags
}

resource "local_file" "pem_file" {
  content  = tls_private_key.this.private_key_pem
  filename = "${path.module}/../../${var.key_name}.pem"
}

output "key_name" {
  value = aws_key_pair.this.key_name
}

variable "key_name" {}
variable "tags" {
  type = map(string)
}
