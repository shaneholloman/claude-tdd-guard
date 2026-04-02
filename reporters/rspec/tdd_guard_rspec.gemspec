# frozen_string_literal: true

Gem::Specification.new do |spec|
  spec.name = "tdd-guard-rspec"
  spec.version = "0.1.0"
  spec.authors = ["Hiro-Chiba"]
  spec.summary = "RSpec formatter for TDD Guard - enforces Test-Driven Development principles"
  spec.description = "RSpec formatter that captures test results for TDD Guard validation."
  spec.homepage = "https://github.com/nizos/tdd-guard"
  spec.license = "MIT"
  spec.required_ruby_version = ">= 3.2.0"

  spec.files = Dir["lib/**/*.rb"]
  spec.require_paths = ["lib"]

  spec.add_dependency "rspec-core", "~> 3.0"

  spec.add_development_dependency "rspec", "~> 3.0"
  spec.add_development_dependency "climate_control", "~> 1.0"
end
