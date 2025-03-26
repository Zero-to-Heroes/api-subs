// This example demonstrates a NodeJS 8.10 async handler[1], however of course you could use
// the more traditional callback-style handler.

import { GetSecretValueRequest } from 'aws-sdk/clients/secretsmanager';
import { SecretInfo, getSecret } from './utils';

const STORE_PUBLIC_TOKEN = 'xjh0-5ef1e6461f2aa381db4df635c3c0c5556aed5191';

// [1]: https://aws.amazon.com/blogs/compute/node-js-8-10-runtime-now-available-in-aws-lambda/
export default async (event, context, callback): Promise<any> => {
	console.debug('handling event', event);
	const headers = {
		'Access-Control-Allow-Headers':
			'Accept,Accept-Language,Content-Language,Content-Type,Authorization,x-correlation-id,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
		'Access-Control-Allow-Methods': 'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT',
		'Access-Control-Allow-Origin': event.headers.Origin || event.headers.origin || '*',
	};

	// Preflight
	if (event.requestContext.http.method === 'OPTIONS') {
		const response = {
			statusCode: 200,
			body: null,
			headers: headers,
		};
		return response;
	}

	const bearerToken = getUserOwToken(event);
	console.debug('bearerToken', bearerToken);
	const packageId = getPackageId(event);
	console.debug('packageId', packageId);
	const subsForToken: readonly TebexSub[] = await getTebexSubsForToken(bearerToken);
	console.debug('subsForToken', subsForToken);
	const tebexPackage = subsForToken.find((sub) => sub.packageId === packageId);
	console.debug('tebexPackage', tebexPackage);
	if (!tebexPackage) {
		return {
			statusCode: 404,
			body: null,
			headers: headers,
		};
	}

	const paymentId = tebexPackage.recurringPaymentId;
	const subDetails = await getTebexSubDetails(paymentId);
	return {
		statusCode: 200,
		body: subDetails,
		headers: headers,
	};
};

const getTebexSubDetails = async (paymentId: string): Promise<any> => {
	const url = `https://checkout.tebex.io/api/recurring-payments/${paymentId}`;
	const tebexCredentials = await getTebexCredentials();
	const base64encoded = Buffer.from(tebexCredentials.publicKey + ':' + tebexCredentials.privateKey).toString(
		'base64',
	);
	console.debug('base64encoded', base64encoded, tebexCredentials);
	const headers = new Headers({
		'Content-Type': 'application/json',
		Authorization: `Basic ${base64encoded}`,
	});
	const result = await fetch(url, {
		headers: headers,
	});
	console.debug('result', result);
	console.debug('result text', await result.text());
	return await result.json();
};

const getTebexSubsForToken = async (bearerToken: string): Promise<readonly TebexSub[]> => {
	const url = `https://subscriptions-api.overwolf.com/subscriptions/${STORE_PUBLIC_TOKEN}?extensionId=lnknbakkpommmjjdnelmfbjjdbocfpnpbkijjnob`;
	const headers = new Headers({
		'Content-Type': 'application/json',
		Authorization: `Bearer ${bearerToken}`,
	});
	const result = await fetch(url, { headers: headers });
	// console.debug('result', result);
	return await result.json();
};

const getUserOwToken = (event): string => {
	return event.headers.authorization?.includes('Bearer ') ? event.headers.authorization.split('Bearer ')[1] : null;
};

const getPackageId = (event): number => {
	return parseInt(event.requestContext.http.path.split('/').pop());
};

interface TebexSub {
	userId: string;
	packageId: number;
	recurringPaymentId: string;
	state: 'ACTIVE' | string;
}

const getTebexCredentials = async (): Promise<{ publicKey: string; privateKey: string }> => {
	const secretRequest: GetSecretValueRequest = {
		SecretId: 'overwolf-sub',
	};
	const secret: SecretInfo = await getSecret(secretRequest);
	return { publicKey: secret.tebexPublicKey, privateKey: secret.tebexPrivateKey };
};
