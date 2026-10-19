resource "aws_ecr_repository" "api" {
  name                 = "${var.project}-api"
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration { scan_on_push = true }
}

resource "aws_ecr_lifecycle_policy" "api" {
  repository = aws_ecr_repository.api.name
  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "keep last 10"
      selection    = { tagStatus = "any", countType = "imageCountMoreThan", countNumber = 10 }
      action       = { type = "expire" }
    }]
  })
}

resource "terraform_data" "image" {
  triggers_replace = [aws_ecr_repository.api.repository_url, var.image_tag]

  provisioner "local-exec" {
    working_dir = "${path.module}/${var.app_path}"
    command     = <<-EOT
      set -e
      aws ecr get-login-password --region ${var.region} | docker login --username AWS --password-stdin ${split("/", aws_ecr_repository.api.repository_url)[0]}
      docker build --platform linux/amd64 -t ${aws_ecr_repository.api.repository_url}:${var.image_tag} .
      docker push ${aws_ecr_repository.api.repository_url}:${var.image_tag}
    EOT
  }
}
