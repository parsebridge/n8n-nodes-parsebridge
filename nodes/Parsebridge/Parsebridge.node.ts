import {
	NodeConnectionTypes,
	type IExecuteFunctions,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
} from 'n8n-workflow';

export class Parsebridge implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Parsebridge',
		name: 'parsebridge',
		icon: 'file:../../icons/github.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Parse PDFs to clean Markdown',
		defaults: {
			name: 'Parsebridge',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'parsebridgeApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Parse PDF From URL',
						value: 'parseUrl',
						description: 'Convert a PDF at a given URL to Markdown',
						action: 'Parse a PDF from URL',
					},
					{
						name: 'Parse PDF From File',
						value: 'parseFile',
						description: 'Convert an uploaded PDF file to Markdown',
						action: 'Parse a PDF from file',
					},
				],
				default: 'parseUrl',
			},
			{
				displayName: 'URL',
				name: 'url',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'https://example.com/document.pdf',
				description: 'The URL of the PDF file',
				displayOptions: {
					show: {
						operation: ['parseUrl'],
					},
				},
			},
			{
				displayName: 'Binary Property',
				name: 'binaryPropertyName',
				type: 'string',
				required: true,
				default: 'data',
				description: 'The name of the input binary property containing the PDF file',
				displayOptions: {
					show: {
						operation: ['parseFile'],
					},
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;

				let responseData: INodeExecutionData['json'];

				if (operation === 'parseUrl') {
					const url = this.getNodeParameter('url', i) as string;

					responseData = (await this.helpers.httpRequestWithAuthentication.call(
						this,
						'parsebridgeApi',
						{
							method: 'POST',
							url: 'https://api.parsebridge.com/v1/parse/url',
							headers: {
								'Content-Type': 'application/json',
							},
							body: { url },
						},
					)) as INodeExecutionData['json'];
				} else {
					const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
					this.helpers.assertBinaryData(i, binaryPropertyName);
					const buffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);

					responseData = (await this.helpers.httpRequestWithAuthentication.call(
						this,
						'parsebridgeApi',
						{
							method: 'POST',
							url: 'https://api.parsebridge.com/v1/parse/file',
							headers: {
								'Content-Type': 'application/pdf',
							},
							body: buffer,
						},
					)) as INodeExecutionData['json'];
				}

				returnData.push({
					json: responseData,
					pairedItem: { item: i },
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
