import axios from 'axios';
import jwt from 'jsonwebtoken';

interface Jwk {
    kid: string;
    alg: string;
    kty: string;
    use: string;
    n: string;
    e: string;
}

async function getJwks(): Promise<Jwk[]> {
    const response = await axios.get<{ keys: Jwk[] }>(
        `${process.env.AUTH0_ISSUER_BASE_URL}/.well-known/jwks.json`
    );
    return response.data.keys;
}

function getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
    getJwks().then(keys => {
        const key = keys.find(k => k.kid === header.kid);
        if (!key) {
            callback(new Error('Key not found'));
            return;
        }
        callback(null, key.n);
    }).catch(err => callback(err));
}