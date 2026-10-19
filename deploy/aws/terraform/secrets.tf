resource "random_password" "db" {
  length  = 32
  special = false
}

resource "random_password" "jwt" {
  length  = 48
  special = false
}

resource "aws_ssm_parameter" "db_password" {
  name  = "/${var.project}/db-password"
  type  = "SecureString"
  value = random_password.db.result
}

resource "aws_ssm_parameter" "jwt_secret" {
  name  = "/${var.project}/jwt-secret"
  type  = "SecureString"
  value = random_password.jwt.result
}
