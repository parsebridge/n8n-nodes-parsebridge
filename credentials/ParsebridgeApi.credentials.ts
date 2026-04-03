import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	Icon,
	INodeProperties,
} from 'n8n-workflow';

export class ParsebridgeApi implements ICredentialType {
	name = 'parsebridgeApi';

	displayName = 'Parsebridge API';

	icon: Icon = 'file:../icons/github.svg';

	documentationUrl = 'https://parsebridge.com/docs';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			placeholder: 'pb_your_api_key',
			required: true,
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.parsebridge.com',
			url: '/v1/parse/url',
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ url: 'https://example.com/test.pdf' }),
		},
	};
}
