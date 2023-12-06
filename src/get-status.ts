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
	return {
		statusCode: 200,
		body: sub,
		headers: headers,
	};
};
