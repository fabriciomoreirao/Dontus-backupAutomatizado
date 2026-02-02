import { SetMetadata } from '@nestjs/common';
import { RolesPermission } from '../constants';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: RolesPermission[]) => SetMetadata(ROLES_KEY, roles);
