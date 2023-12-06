import { getBearerToken, getOwToken, getSub, getUserName } from './utils';

// This example demonstrates a NodeJS 8.10 async handler[1], however of course you could use
// the more traditional callback-style handler.
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
	if (!event.body) {
		const response = {
			statusCode: 200,
			body: null,
			headers: headers,
		};
		return response;
	}

	const bearerToken = await getBearerToken();
	const owToken = getOwToken(event);
	const userName = await getUserName(owToken);
	const sub = await getSub(userName, bearerToken);
	const subId = sub?.id;
	await unsub(subId, bearerToken);
	return {
		statusCode: 200,
		body: null,
		headers: headers,
	};
};

const unsub = async (subId: number, bearerToken: string) => {
	const requestBody = {
		state: 1,
		planId: 13,
	};
	const unsubResponse = await fetch(`https://console-be.overwolf.com/subscriptions/${subId}`, {
		headers: {
			Accept: 'application/json',
			authorization: `Bearer ${bearerToken}`,
			'content-type': 'application/json',
		},
		body: JSON.stringify(requestBody),
		method: 'PUT',
	});
	console.debug('unsubResponse', unsubResponse);
	if (unsubResponse.status !== 200) {
		console.error('unsub failed', unsubResponse);
		throw new Error();
	}
};
