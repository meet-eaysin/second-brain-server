export const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const validateLoginRequest = (body: any): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!body.email) {
        errors.push('Email is required');
    } else if (!validateEmail(body.email)) {
        errors.push('Invalid email format');
    }

    if (!body.password) {
        errors.push('Password is required');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};

export const validateRegisterRequest = (body: any): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!body.email) {
        errors.push('Email is required');
    } else if (!validateEmail(body.email)) {
        errors.push('Invalid email format');
    }

    if (!body.password) {
        errors.push('Password is required');
    } else if (body.password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};

export const validateRefreshTokenRequest = (body: any): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!body.refreshToken) {
        errors.push('Refresh token is required');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};
