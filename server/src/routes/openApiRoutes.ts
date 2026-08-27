import { Router, Request, Response } from 'express';
import { OpenApiService } from '../services/OpenApiService.js';

const router = Router();

// GET /api/openapi.json
router.get('/openapi.json', (req: Request, res: Response) => {
  const protocol = req.protocol;
  const host = req.get('host') || 'localhost:5001';
  const serverUrl = `${protocol}://${host}/api`;
  
  const spec = OpenApiService.getSpec(serverUrl);
  res.setHeader('Content-Type', 'application/json');
  res.json(spec);
});

// GET /api/openapi.yaml
router.get('/openapi.yaml', (req: Request, res: Response) => {
  const protocol = req.protocol;
  const host = req.get('host') || 'localhost:5001';
  const serverUrl = `${protocol}://${host}/api`;

  const spec = OpenApiService.getSpec(serverUrl);
  const yaml = OpenApiService.toYaml(spec);
  res.setHeader('Content-Type', 'text/yaml');
  res.send(yaml);
});

// GET /api/openapi (alias for JSON)
router.get('/openapi', (req: Request, res: Response) => {
  const protocol = req.protocol;
  const host = req.get('host') || 'localhost:5001';
  const serverUrl = `${protocol}://${host}/api`;

  const spec = OpenApiService.getSpec(serverUrl);
  res.setHeader('Content-Type', 'application/json');
  res.json(spec);
});

export default router;
