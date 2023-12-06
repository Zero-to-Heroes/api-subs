import { validateOwToken } from '@firestone-hs/aws-lambda-utils';
import { SecretsManager } from 'aws-sdk';
import { GetSecretValueRequest, GetSecretValueResponse } from 'aws-sdk/clients/secretsmanager';

const secretsManager = new SecretsManager({ region: 'us-west-2' });

export const getUserName = async (owToken: string): Promise<string> => {
	const validationResult = await validateOwToken(owToken);
	if (!validationResult?.username) {
		console.error('invalid ow token', owToken);
		throw new Error();
	}
	console.debug('validationResult', validationResult);
	return validationResult.username;
};

export const getOwToken = (event) => {
	if (!event?.body?.length) {
		return null;
	}
	return JSON.parse(event.body).owToken;
};

export const getSub = async (userName: string, bearerToken: string): Promise<OwSub> => {
	const url = `https://console-be.overwolf.com/subscriptions?filter=%7B%22extensionId%22%3A%22lnknbakkpommmjjdnelmfbjjdbocfpnpbkijjnob%22%2C%22username%22%3A%22${userName}%22%7D&range=%5B0%2C24%5D&sort=%5B%22expireAt%22%2C%22DESC%22%5D`;
	const subsResponse = await fetch(url, {
		headers: {
			Accept: 'application/json',
			authorization: `Bearer ${bearerToken}`,
			'content-type': 'application/json',
			range: 'subscriptions=0-24',
		},
		method: 'GET',
	});
	console.debug('subsResponse', subsResponse);
	if (subsResponse.status !== 200) {
		console.error('subs retrieve failed', subsResponse);
		throw new Error();
	}
	const subs = await subsResponse.json();
	console.debug('subs', subs);
	const sub = subs.find((s) => s.username?.toLowerCase() === userName?.toLowerCase());
	console.debug(
		'sub',
		sub,
		userName,
		subs.map((s) => s.username),
	);
	return sub;
};

export const getBearerToken = async (): Promise<string> => {
	const secretRequest: GetSecretValueRequest = {
		SecretId: 'overwolf-sub',
	};
	const secret: SecretInfo = await getSecret(secretRequest);
	console.debug('secretResponse', secret);
	return secret.token;
};

export const getSecret = (secretRequest: GetSecretValueRequest) => {
	return new Promise<SecretInfo>((resolve) => {
		secretsManager.getSecretValue(secretRequest, (err, data: GetSecretValueResponse) => {
			const secretInfo: SecretInfo = JSON.parse(data.SecretString);
			resolve(secretInfo);
		});
	});
};

export interface SecretInfo {
	readonly token: string;
	readonly tebexPublicKey: string;
	readonly tebexPrivateKey: string;
}

export interface OwSub {
	readonly id: number;
	readonly username: string;
	readonly expireAt: Date;
	readonly state: number;
}
