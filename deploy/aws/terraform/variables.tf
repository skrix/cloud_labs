variable "region" {
  type    = string
  default = "eu-central-1"
}

variable "project" {
  type    = string
  default = "iot-hub"
}

variable "github_repo" {
  type = string
}

variable "budget_email" {
  type = string
}

variable "app_path" {
  type    = string
  default = "../../.."
}

variable "image_tag" {
  type    = string
  default = "latest"
}
