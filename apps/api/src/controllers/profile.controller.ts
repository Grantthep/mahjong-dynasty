import type { RequestHandler } from 'express';
import { getUserId } from '../middleware/auth';
import type { ProfileService } from '../services/profile.service';

export function createProfileController(profile: ProfileService) {
  const get: RequestHandler = async (_req, res) => {
    res.json(await profile.getProfile(getUserId(res)));
  };
  return { get };
}
