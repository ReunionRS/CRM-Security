import type { UserRole } from './Roles';
import { DEFAULT_ROLE } from './Roles';

export class User {
    fio: string;
    email: string;
    role: UserRole;

    constructor(fio: string, email: string, role: UserRole = DEFAULT_ROLE) {
        this.fio = fio;
        this.email = email;
        this.role = role;
    }
}
