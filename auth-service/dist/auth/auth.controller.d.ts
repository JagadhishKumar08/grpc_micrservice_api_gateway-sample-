export declare class AuthController {
    login(data: {
        email: string;
    }): {
        accessToken: string;
    };
    validateToken(data: {
        token: string;
    }): {
        userId: any;
        isValid: boolean;
    };
}
