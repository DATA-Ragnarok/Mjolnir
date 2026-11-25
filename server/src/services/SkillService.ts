import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { AppError } from '../middleware/errorHandler.js';

const SKILLS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../skills');

export type Skill = { name: string; version: number; body: string };

const parseSkill = (raw: string): Skill => {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error('Skill file is missing front matter');
  const meta: Record<string, string> = {};
  for (const line of (match[1] as string).split(/\r?\n/)) {
    const idx = line.indexOf(':');
    if (idx > 0) meta[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return { name: meta['name'] as string, version: Number(meta['version'] || 1), body: (match[2] as string).trim() };
};

export class SkillService {
  static listSkills(): Skill[] {
    return fs
      .readdirSync(SKILLS_DIR)
      .filter((f) => f.endsWith('.md') && !f.includes('.template.'))
      .sort()
      .map((f) => parseSkill(fs.readFileSync(path.join(SKILLS_DIR, f), 'utf8')));
  }

  static getSkills(name?: string): { skills: Skill[]; etag: string } {
    let skills = this.listSkills();
    if (name) {
      skills = skills.filter((s) => s.name === name);
      if (skills.length === 0) throw new AppError(404, `Unknown skill: ${name}`);
    }
    const etag = `"${crypto.createHash('sha1').update(JSON.stringify(skills)).digest('hex')}"`;
    return { skills, etag };
  }

  static getBootstrapSkill(baseUrl: string): string {
    const tpl = fs.readFileSync(path.join(SKILLS_DIR, 'bootstrap.template.md'), 'utf8');
    return tpl.replace(/\{\{BASE_URL\}\}/g, baseUrl.replace(/\/$/, ''));
  }
}
