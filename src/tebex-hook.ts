// This example demonstrates a NodeJS 8.10 async handler[1], however of course you could use
// the more traditional callback-style handler.
// [1]: https://aws.amazon.com/blogs/compute/node-js-8-10-runtime-now-available-in-aws-lambda/
export default async (event, context, callback): Promise<any> => {
	console.debug('tebex hook', event);
	const body = JSON.parse(event.body);
	// TODO: add validation
	console.debug('body', body.type, body);
	if (body.type === 'validation.webhook') {
		return {
			statusCode: 200,
			body: JSON.stringify({ id: body.id }),
		};
	}
};
