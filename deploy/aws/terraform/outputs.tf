output "url" {
  value = "http://${aws_lb.api.dns_name}"
}

output "ecr_repository" {
  value = aws_ecr_repository.api.name
}

output "github_role_arn" {
  value = aws_iam_role.github_deploy.arn
}

output "ecs_cluster" {
  value = aws_ecs_cluster.main.name
}

output "ecs_service" {
  value = aws_ecs_service.api.name
}

output "ecs_task_family" {
  value = aws_ecs_task_definition.api.family
}

output "public_subnet_ids" {
  value = aws_subnet.public[*].id
}

output "app_security_group_id" {
  value = aws_security_group.app.id
}
