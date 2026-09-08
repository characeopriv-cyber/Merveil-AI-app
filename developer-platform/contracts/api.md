# Developer API contract

All developer operations are authenticated server-side and scoped to the signed-in developer/project.

## Projects
- POST /api/developer/projects
- GET /api/developer/projects/:id
- PATCH /api/developer/projects/:id
- DELETE /api/developer/projects/:id

## Files
- GET /api/developer/projects/:id/files
- PUT /api/developer/projects/:id/files/:path
- DELETE /api/developer/projects/:id/files/:path

## Build
- POST /api/developer/projects/:id/builds
- GET /api/developer/projects/:id/builds/:buildId
- GET /api/developer/projects/:id/builds/:buildId/logs

## Deployment
- POST /api/developer/projects/:id/deployments
- GET /api/developer/projects/:id/deployments
- POST /api/developer/projects/:id/deployments/:deploymentId/rollback

## Agents
- POST /api/developer/projects/:id/agents
- PATCH /api/developer/projects/:id/agents/:agentId
- POST /api/developer/projects/:id/agents/:agentId/test
- POST /api/developer/projects/:id/agents/:agentId/deploy

## AI Builder
- POST /api/developer/projects/:id/builder

The builder response is a structured change set (files to create/update/delete plus explanation and validation results). It does not directly execute arbitrary code.

## Publish
- POST /api/developer/projects/:id/publish
- GET /api/developer/projects/:id/publishing
