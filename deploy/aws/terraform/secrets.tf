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

# Admin account for the catalog seeder, read from the repo's .env (ADMIN_EMAIL, ADMIN_PASSWORD).
locals {
  dotenv_path = "${path.module}/../../../.env"
  dotenv = fileexists(local.dotenv_path) ? {
    for m in regexall("(?m)^[ \\t]*([A-Za-z_][A-Za-z0-9_]*)[ \\t]*=[ \\t]*(.*?)[ \\t]*$", file(local.dotenv_path)) :
    m[0] => trim(m[1], "\"'")
  } : {}
  admin_email    = lookup(local.dotenv, "ADMIN_EMAIL", "")
  admin_password = lookup(local.dotenv, "ADMIN_PASSWORD", "")
}

resource "aws_ssm_parameter" "admin_email" {
  name  = "/${var.project}/admin-email"
  type  = "String"
  value = local.admin_email

  lifecycle {
    precondition {
      condition     = local.admin_email != "" && local.admin_password != ""
      error_message = "Set ADMIN_EMAIL and ADMIN_PASSWORD in .env (see .env.example)."
    }
  }
}

resource "aws_ssm_parameter" "admin_password" {
  name  = "/${var.project}/admin-password"
  type  = "SecureString"
  value = local.admin_password
}
