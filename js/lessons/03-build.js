/* ============ 09 VPC IN CLOUDFORMATION ============ */
LESSONS.push({
  id: 'vpc-template', num: 9, cat: 'adv', layer: 4, mins: 17,
  title: 'Build a VPC in CloudFormation', short: 'Subnets, IGW, routes, DependsOn',
  overview: `<p>A VPC is the classic multi-resource template: the VPC, subnets in two AZs, an internet gateway <b>and its attachment</b>, a route table, a default route, and associations that link subnets to the table. It's where you'll feel why references and DependsOn matter.</p>`,
  hook: `<b>"VPC, Subnets, Gateway, Attach, Table, Route, Associate"</b>: <b>V</b>ery <b>S</b>mart <b>G</b>eeks <b>A</b>lways <b>T</b>est <b>R</b>outes <b>A</b>gain.`,
  why: `Every app stack sits on a network stack. Building one in code (rather than the console wizard) is a standard interview task and a daily job for cloud engineers.`,
  scene: { type: 'graph', nodes: [
    { id: 'vpc', x: 470, y: 90, icon: 'cloud', label: 'AppVPC', sub: '10.0.0.0/16' },
    { id: 'sa', x: 250, y: 260, icon: 'box', label: 'PublicSubnetA', sub: '10.0.1.0/24 · az a', at: 1 },
    { id: 'sb', x: 690, y: 260, icon: 'box', label: 'PublicSubnetB', sub: '10.0.2.0/24 · az b', at: 1 },
    { id: 'igw', x: 870, y: 90, icon: 'globe', label: 'IGW + Attachment', sub: 'VPCGatewayAttachment', at: 2 },
    { id: 'rt', x: 470, y: 420, icon: 'list', label: 'PublicRT', sub: '0.0.0.0/0 → igw', at: 3 },
    { id: 'sg', x: 120, y: 90, icon: 'firewall', label: 'WebSG', sub: '443 from 0.0.0.0/0', at: 4 }
  ], edges: [{ a: 'vpc', b: 'sa' }, { a: 'vpc', b: 'sb' }, { a: 'vpc', b: 'igw' }, { a: 'sa', b: 'rt' }, { a: 'sb', b: 'rt' }, { a: 'rt', b: 'igw' }, { a: 'vpc', b: 'sg' }] },
  steps: [
    { t: 'The VPC', sub: 'AWS::EC2::VPC',
      body: `<p><code>CidrBlock: 10.0.0.0/16</code> plus <code>EnableDnsSupport</code> and <code>EnableDnsHostnames: true</code> (needed for many services and VPC endpoints). <code>!Ref AppVPC</code> returns the <code>vpc-…</code> ID used by everything else.</p>`,
      analogy: `The VPC is the <b>plot of land</b>; everything else is built on it.`,
      hook: `<b>!Ref VPC → vpc-id. Everyone needs it.</b>`,
      words: ['AWS::EC2::VPC', 'CidrBlock', 'EnableDnsHostnames', 'VpcId'],
      focus: ['vpc'],
      cmds: [{ c: '  AppVPC:\n    Type: AWS::EC2::VPC\n    Properties:\n      CidrBlock: 10.0.0.0/16\n      EnableDnsSupport: true\n      EnableDnsHostnames: true', f: 'network.yaml', o: '', k: 'tpl' }] },
    { t: 'Subnets in two AZs', sub: '!Select + !GetAZs',
      body: `<p>Never hard-code AZ names: <code>AvailabilityZone: !Select [0, !GetAZs ""]</code> and <code>[1, …]</code>. The template then works in any region. <code>MapPublicIpOnLaunch: true</code> makes instances in that subnet get public IPs.</p>`,
      analogy: `Two buildings on <b>different streets</b>: one flood doesn't take both.`,
      hook: `<b>Two AZs minimum. !Select them, don't type them.</b>`,
      words: ['AWS::EC2::Subnet', 'Fn::GetAZs', 'Fn::Select', 'MapPublicIpOnLaunch', 'multi-AZ'],
      flow: { from: 'vpc', to: 'sa', label: 'SUBNETS', detail: ['az a 10.0.1.0/24', 'az b 10.0.2.0/24'], color: 'purple' }, focus: ['vpc', 'sa', 'sb'],
      cmds: [{ c: '  PublicSubnetA:\n    Type: AWS::EC2::Subnet\n    Properties:\n      VpcId: !Ref AppVPC\n      CidrBlock: 10.0.1.0/24\n      AvailabilityZone: !Select [0, !GetAZs ""]\n      MapPublicIpOnLaunch: true', f: 'network.yaml', o: '', k: 'tpl' }] },
    { t: 'Gateway + attachment', sub: 'Two resources, not one',
      body: `<p><code>AWS::EC2::InternetGateway</code> creates the gateway; <code>AWS::EC2::VPCGatewayAttachment</code> (VpcId + InternetGatewayId) plugs it into the VPC. Forgetting the attachment is a classic: the route then fails or traffic goes nowhere.</p>`,
      analogy: `Buying a <b>front door</b> (IGW) vs actually <b>installing it in the wall</b> (attachment).`,
      hook: `<b>Gateway + Attachment: buy it AND install it.</b>`,
      words: ['InternetGateway', 'VPCGatewayAttachment', 'InternetGatewayId'],
      flow: { from: 'igw', to: 'vpc', label: 'ATTACH', detail: ['igw-… attached to vpc-…'], color: 'amber' }, focus: ['igw', 'vpc'],
      cmds: [{ c: '  IGW:\n    Type: AWS::EC2::InternetGateway\n  GatewayAttachment:\n    Type: AWS::EC2::VPCGatewayAttachment\n    Properties:\n      VpcId: !Ref AppVPC\n      InternetGatewayId: !Ref IGW', f: 'network.yaml', o: '', k: 'tpl' }] },
    { t: 'Route table, route, associations', sub: 'And the DependsOn',
      body: `<p>RouteTable (VpcId) → Route (<code>DestinationCidrBlock: 0.0.0.0/0</code>, <code>GatewayId: !Ref IGW</code>) → one <code>SubnetRouteTableAssociation</code> per subnet.</p><p>The route references the IGW but <b>not the attachment</b>, so CloudFormation might create it before the gateway is attached. Fix: <code>DependsOn: GatewayAttachment</code> on the route.</p>`,
      analogy: `Putting up a road sign to a <b>bridge that isn't finished</b>: wait for the bridge.`,
      hook: `<b>Route → DependsOn → Attachment. Every time.</b>`,
      words: ['RouteTable', 'AWS::EC2::Route', 'SubnetRouteTableAssociation', 'DependsOn GatewayAttachment'],
      flow: { from: 'rt', to: 'igw', label: 'ROUTE', detail: ['0.0.0.0/0 → igw (after attachment)'], color: 'green' }, focus: ['rt', 'igw', 'sa', 'sb'],
      cmds: [{ c: '  PublicRoute:\n    Type: AWS::EC2::Route\n    DependsOn: GatewayAttachment\n    Properties:\n      RouteTableId: !Ref PublicRT\n      DestinationCidrBlock: 0.0.0.0/0\n      GatewayId: !Ref IGW\n  AssocA:\n    Type: AWS::EC2::SubnetRouteTableAssociation\n    Properties:\n      SubnetId: !Ref PublicSubnetA\n      RouteTableId: !Ref PublicRT', f: 'network.yaml', o: '', k: 'tpl' }] },
    { t: 'Security group & exports', sub: 'Hand off to app stacks',
      body: `<p>Add a <code>AWS::EC2::SecurityGroup</code> with <code>SecurityGroupIngress</code> rules (443 from anywhere, 22 from <b>nobody</b>; use SSM Session Manager). Then <b>export</b> the VPC ID and subnet IDs so app stacks can import them (lesson 11).</p><p>Private subnets + NAT gateway follow the same pattern with a second route table.</p>`,
      analogy: `The network team builds the <b>roads</b> and publishes a <b>map</b>; app teams just read the map.`,
      hook: `<b>Network stack exports, app stacks import.</b>`,
      words: ['SecurityGroup', 'SecurityGroupIngress', 'Export VpcId', 'network stack'],
      flow: { from: 'vpc', to: 'sg', label: 'SG', detail: ['tcp 443 from 0.0.0.0/0'], color: 'teal' }, focus: ['vpc', 'sg'],
      cmds: [{ c: 'aws cloudformation deploy --template-file network.yaml --stack-name raul-network && aws cloudformation list-exports --query "Exports[?starts_with(Name,\'raul-network\')].Name"', o: '\nSuccessfully created/updated stack - raul-network\n[\n    "raul-network-VpcId",\n    "raul-network-PublicSubnets"\n]', k: 'cfn' }],
      cloud: `<b>Link</b>: VPC Explorer covers the networking behind each of these resources.` }
  ],
  summary: { title: 'You can code a network', sub: 'VPC · subnets · IGW+attachment · routes · DependsOn', text: `<p>VPC → two subnets in different AZs via <code>!Select [i, !GetAZs ""]</code> → IGW + VPCGatewayAttachment → route table, a 0.0.0.0/0 route with <code>DependsOn: GatewayAttachment</code>, one association per subnet → security group → export IDs for app stacks.</p>` },
  quiz: [
    { q: 'Pick the first AZ portably:', a: ['ap-southeast-1a', '!Select [0, !GetAZs ""]', '!Ref AZ', '!GetAtt VPC.AZ'], c: 1, why: 'Works in every region.' },
    { q: 'What connects an IGW to a VPC?', a: ['Route', 'VPCGatewayAttachment', 'Subnet', 'NACL'], c: 1, why: 'Attachment is its own resource.' },
    { q: 'Why DependsOn on the public route?', a: ['Speed', 'It must wait for the gateway attachment it doesn’t reference', 'Cost', 'It’s required syntax'], c: 1, why: 'No implicit dependency exists.' },
    { q: 'Link a subnet to a route table with…', a: ['SubnetRouteTableAssociation', 'RouteTableId on the subnet', 'DependsOn', 'Export'], c: 0, why: 'One association per subnet.' }
  ],
  challenge: { task: 'Complete the network: an IGW with a VPCGatewayAttachment, a 0.0.0.0/0 route to the IGW that DependsOn the attachment, and associate BOTH subnets (which must be in different AZs via !Select/!GetAZs) with PublicRT.',
    hint: Y('Resources:', '  AppVPC:', '    Type: AWS::EC2::VPC', '    Properties:', '      CidrBlock: 10.0.0.0/16', '  PublicSubnetA:', '    Type: AWS::EC2::Subnet', '    Properties:', '      VpcId: !Ref AppVPC', '      CidrBlock: 10.0.1.0/24', '      AvailabilityZone: !Select [0, !GetAZs ""]', '  PublicSubnetB:', '    Type: AWS::EC2::Subnet', '    Properties:', '      VpcId: !Ref AppVPC', '      CidrBlock: 10.0.2.0/24', '      AvailabilityZone: !Select [1, !GetAZs ""]', '  IGW:', '    Type: AWS::EC2::InternetGateway', '  GatewayAttachment:', '    Type: AWS::EC2::VPCGatewayAttachment', '    Properties:', '      VpcId: !Ref AppVPC', '      InternetGatewayId: !Ref IGW', '  PublicRT:', '    Type: AWS::EC2::RouteTable', '    Properties:', '      VpcId: !Ref AppVPC', '  PublicRoute:', '    Type: AWS::EC2::Route', '    DependsOn: GatewayAttachment', '    Properties:', '      RouteTableId: !Ref PublicRT', '      DestinationCidrBlock: 0.0.0.0/0', '      GatewayId: !Ref IGW', '  AssocA:', '    Type: AWS::EC2::SubnetRouteTableAssociation', '    Properties:', '      SubnetId: !Ref PublicSubnetA', '      RouteTableId: !Ref PublicRT', '  AssocB:', '    Type: AWS::EC2::SubnetRouteTableAssociation', '    Properties:', '      SubnetId: !Ref PublicSubnetB', '      RouteTableId: !Ref PublicRT', 'Outputs:', '  VpcId:', '    Value: !Ref AppVPC', '    Export:', '      Name: !Sub "${AWS::StackName}-VpcId"'),
    starter: Y('Resources:', '  AppVPC:', '    Type: AWS::EC2::VPC', '    Properties:', '      CidrBlock: 10.0.0.0/16', '  PublicSubnetA:', '    Type: AWS::EC2::Subnet', '    Properties:', '      VpcId: !Ref AppVPC', '      CidrBlock: 10.0.1.0/24', '      AvailabilityZone: ap-southeast-1a', '  PublicSubnetB:', '    Type: AWS::EC2::Subnet', '    Properties:', '      VpcId: !Ref AppVPC', '      CidrBlock: 10.0.2.0/24', '      AvailabilityZone: ap-southeast-1a', '  IGW:', '    Type: AWS::EC2::InternetGateway', '  PublicRT:', '    Type: AWS::EC2::RouteTable', '    Properties:', '      VpcId: !Ref AppVPC', '  # TODO: attachment, route, associations'),
    check: r => { if (!r.ok) return 'deploy must succeed'; const R = r.tpl.Resources;
      const subs = RES(r, 'AWS::EC2::Subnet'); if (subs.length < 2) return 'need two subnets';
      if (!Object.values(R).filter(x => x.Type === 'AWS::EC2::Subnet').every(x => JSON.stringify(x.Properties.AvailabilityZone || '').includes('GetAZs'))) return 'use !Select [n, !GetAZs ""] for AvailabilityZone (no hard-coded AZ)';
      if (subs[0].Properties.AvailabilityZone === subs[1].Properties.AvailabilityZone) return 'the two subnets must be in different AZs ([0] and [1])';
      const att = Object.entries(R).find(([, x]) => x.Type === 'AWS::EC2::VPCGatewayAttachment'); if (!att) return 'add an AWS::EC2::VPCGatewayAttachment (VpcId + InternetGatewayId)';
      const rt = Object.entries(R).find(([, x]) => x.Type === 'AWS::EC2::Route'); if (!rt) return 'add an AWS::EC2::Route';
      const rr = r.resources[rt[0]].Properties; const igw = RES(r, 'AWS::EC2::InternetGateway')[0];
      if (rr.DestinationCidrBlock !== '0.0.0.0/0' || rr.GatewayId !== igw.ref) return 'route needs DestinationCidrBlock 0.0.0.0/0 and GatewayId !Ref IGW';
      if (![].concat(rt[1].DependsOn || []).includes(att[0])) return 'the route must DependsOn: ' + att[0];
      const asc = RES(r, 'AWS::EC2::SubnetRouteTableAssociation'); const ids = new Set(asc.map(a => a.Properties.SubnetId));
      return subs.every(s => ids.has(s.ref)) ? true : 'associate BOTH subnets with the route table'; } },
  next: `Network done. Now the fun part: a complete <b>serverless app</b> (DynamoDB + least-privilege role + Lambda + HTTP API) in one template, then the same thing in 30 lines of SAM.`,
  cheat: [['AWS::EC2::VPC CidrBlock', 'network'], ['!Select [0, !GetAZs ""]', 'portable AZ'], ['InternetGateway + VPCGatewayAttachment', 'internet door'], ['Route DependsOn: GatewayAttachment', 'ordering fix'], ['SubnetRouteTableAssociation', 'one per subnet'], ['Export VpcId', 'share with app stacks']]
});

/* ============ 10 SERVERLESS APP + SAM ============ */
LESSONS.push({
  id: 'serverless-app', num: 10, cat: 'adv', layer: 4, mins: 18,
  title: 'A Serverless App Template (+ SAM)', short: 'Table, least-privilege role, Lambda, HTTP API',
  overview: `<p>Put it all together: a DynamoDB table, an IAM role that can <b>only</b> write to that table, a Lambda function, an HTTP API in front, the permission for the API to invoke the function, and outputs. Then see how <b>SAM</b> (Serverless Application Model) shrinks it with a Transform.</p>`,
  hook: `<b>"Table, Role, Function, API, Permission, Output": T-R-F-A-P-O</b>: "<b>T</b>he <b>R</b>eal <b>F</b>unction <b>A</b>lways <b>P</b>ays <b>O</b>ff."`,
  why: `This exact pattern (API → Lambda → DynamoDB) is the "hello world" of serverless on AWS and shows up in interviews, certifications and real projects.`,
  scene: { type: 'graph', nodes: [
    { id: 'user', x: 90, y: 240, icon: 'user', label: 'Client', sub: 'POST /invoices' },
    { id: 'api', x: 290, y: 240, icon: 'api', label: 'HttpApi', sub: 'ApiGatewayV2', at: 3 },
    { id: 'fn', x: 510, y: 240, icon: 'lambda', label: 'CreateInvoiceFn', sub: 'python3.12' },
    { id: 'role', x: 510, y: 70, icon: 'key', label: 'FnRole', sub: 'PutItem on table ARN', at: 1 },
    { id: 'tbl', x: 760, y: 240, icon: 'disk', label: 'InvoicesTable', sub: 'PAY_PER_REQUEST' },
    { id: 'logs', x: 510, y: 420, icon: 'log', label: 'CloudWatch Logs', sub: '/aws/lambda/…', at: 2 },
    { id: 'sam', x: 760, y: 420, icon: 'blueprint', label: 'SAM', sub: 'Transform', at: 4 }
  ], edges: [{ a: 'user', b: 'api' }, { a: 'api', b: 'fn' }, { a: 'role', b: 'fn' }, { a: 'fn', b: 'tbl' }, { a: 'fn', b: 'logs' }, { a: 'sam', b: 'fn' }] },
  steps: [
    { t: 'The table', sub: 'On-demand DynamoDB',
      body: `<p><code>BillingMode: PAY_PER_REQUEST</code> means no capacity planning, which suits new apps. Only key attributes go in <code>AttributeDefinitions</code>; other fields are schemaless. Turn on <code>PointInTimeRecoverySpecification</code> for prod, and protect it with DeletionPolicy (lesson 8).</p>`,
      analogy: `A <b>filing cabinet</b> where only the drawer label (key) is fixed.`,
      hook: `<b>Define only the keys. Pay per request.</b>`,
      words: ['DynamoDB::Table', 'PAY_PER_REQUEST', 'KeySchema', 'PointInTimeRecovery'],
      flow: { from: 'fn', to: 'tbl', label: 'TABLE', detail: ['invoiceId (HASH)'], color: 'blue' }, focus: ['tbl'],
      cmds: [{ c: '  InvoicesTable:\n    Type: AWS::DynamoDB::Table\n    Properties:\n      BillingMode: PAY_PER_REQUEST\n      AttributeDefinitions: [{ AttributeName: invoiceId, AttributeType: S }]\n      KeySchema: [{ AttributeName: invoiceId, KeyType: HASH }]', f: 'app.yaml', o: '', k: 'tpl' }] },
    { t: 'Least-privilege role', sub: 'Scope to the table ARN',
      body: `<p>The role trusts <code>lambda.amazonaws.com</code>, gets <code>AWSLambdaBasicExecutionRole</code> for logs, and an inline policy allowing only <code>dynamodb:PutItem</code> on <code>!GetAtt InvoicesTable.Arn</code>. Never <code>"Resource": "*"</code> with <code>dynamodb:*</code>.</p>`,
      analogy: `A key that opens <b>one drawer in one cabinet</b>, not the master key.`,
      hook: `<b>Action specific, Resource !GetAtt. No stars.</b>`,
      words: ['AssumeRolePolicyDocument', 'ManagedPolicyArns', 'Policies', 'least privilege', 'dynamodb:PutItem'],
      flow: { from: 'role', to: 'fn', label: 'PERMS', detail: ['dynamodb:PutItem on table/InvoicesTable'], color: 'purple' }, focus: ['role', 'fn', 'tbl'],
      cmds: [{ c: '      ManagedPolicyArns:\n        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole\n      Policies:\n        - PolicyName: write-invoices\n          PolicyDocument:\n            Version: "2012-10-17"\n            Statement:\n              - Effect: Allow\n                Action: dynamodb:PutItem\n                Resource: !GetAtt InvoicesTable.Arn', f: 'app.yaml', o: '', k: 'tpl' }],
      cloud: `<b>Link</b>: IAM Explorer's policy simulator lets you test this exact policy.` },
    { t: 'The function', sub: 'Code, handler, env vars',
      body: `<p>Small code can live inline (<code>Code: ZipFile: |</code>); real code is packaged to S3 (<code>aws cloudformation package</code> or <code>sam build</code>). Pass config via <code>Environment</code> variables (<code>TABLE_NAME: !Ref InvoicesTable</code>), never hard-coded names.</p>`,
      analogy: `The <b>worker</b> gets a badge (role) and a note with where to file things (env vars).`,
      hook: `<b>Config in env vars, permissions in the role.</b>`,
      words: ['Lambda::Function', 'Handler', 'Runtime', 'ZipFile', 'Environment', 'package'],
      flow: { from: 'fn', to: 'logs', label: 'LOGS', detail: ['START RequestId… END'], color: 'amber' }, focus: ['fn', 'logs'],
      cmds: [{ c: 'aws cloudformation package --template-file app.yaml --s3-bucket raul-artifacts --output-template-file packaged.yaml', o: 'Uploading to 3f2a…zip  1.2 KiB / 1.2 KiB  (100.00%)\nSuccessfully packaged artifacts and wrote output template to file packaged.yaml.', k: 'cfn' }] },
    { t: 'HTTP API + permission', sub: 'Let API Gateway invoke',
      body: `<p><code>AWS::ApiGatewayV2::Api</code> with <code>ProtocolType: HTTP</code> and <code>Target: !GetAtt CreateInvoiceFn.Arn</code> ("quick create") builds a working API. API Gateway still needs permission to call the function: <code>AWS::Lambda::Permission</code> with <code>Principal: apigateway.amazonaws.com</code>. That's a <b>resource-based policy</b> on the function.</p>`,
      analogy: `The front desk (API) can only <b>call the worker</b> if the worker's door has its name on the guest list (permission).`,
      hook: `<b>Role = what Lambda can do. Permission = who can call Lambda.</b>`,
      words: ['ApiGatewayV2::Api', 'ProtocolType HTTP', 'Lambda::Permission', 'resource-based policy', 'ApiEndpoint'],
      flow: { from: 'api', to: 'fn', label: 'INVOKE', detail: ['lambda:InvokeFunction by apigateway.amazonaws.com'], color: 'green' }, focus: ['user', 'api', 'fn'],
      cmds: [{ c: 'curl -s -X POST "$(aws cloudformation describe-stacks --stack-name raul-app --query "Stacks[0].Outputs[?OutputKey==\'ApiUrl\'].OutputValue" --output text)/invoices" -d \'{"amount": 120}\'', o: '{"invoiceId": "inv-7f3a", "status": "created"}', k: 'tool', f: 'terminal' }] },
    { t: 'SAM: the shortcut', sub: 'Transform: AWS::Serverless-2016-10-31',
      body: `<p>Add <code>Transform: AWS::Serverless-2016-10-31</code> and use <code>AWS::Serverless::Function</code> with <code>Events</code> (Api, SQS, Schedule…) and <code>Policies: [DynamoDBCrudPolicy: {TableName: !Ref InvoicesTable}]</code>. SAM expands it into the role, permission, API and function for you. <code>sam build</code>, <code>sam deploy --guided</code>, <code>sam local invoke</code> run the workflow.</p>`,
      analogy: `SAM is a <b>meal kit</b>: same dinner, pre-chopped ingredients.`,
      hook: `<b>SAM = CloudFormation + macros for serverless.</b>`,
      words: ['SAM', 'Transform', 'AWS::Serverless::Function', 'Events', 'policy templates', 'sam deploy --guided'],
      flow: { from: 'sam', to: 'fn', label: 'EXPAND', detail: ['Function + Role + Permission + Api'], color: 'teal' }, focus: ['sam', 'fn'],
      cmds: [{ c: 'Transform: AWS::Serverless-2016-10-31\nResources:\n  CreateInvoiceFn:\n    Type: AWS::Serverless::Function\n    Properties:\n      Runtime: python3.12\n      Handler: app.handler\n      CodeUri: src/\n      Environment: { Variables: { TABLE_NAME: !Ref InvoicesTable } }\n      Policies:\n        - DynamoDBWritePolicy: { TableName: !Ref InvoicesTable }\n      Events:\n        Create: { Type: HttpApi, Properties: { Path: /invoices, Method: POST } }', f: 'template.yaml (SAM)', o: '', k: 'tpl' }] }
  ],
  summary: { title: 'You built a full serverless backend', sub: 'Table · role · function · API · permission · SAM', text: `<p>DynamoDB on-demand table; a role scoped to <code>!GetAtt Table.Arn</code>; a Lambda with env vars from <code>!Ref</code>; an HTTP API targeting the function plus a <code>Lambda::Permission</code> for apigateway.amazonaws.com; outputs for the URL. SAM's Transform compresses this into a few lines.</p>` },
  quiz: [
    { q: 'Who needs a Lambda::Permission?', a: ['The Lambda role', 'API Gateway, to invoke the function', 'DynamoDB', 'CloudWatch'], c: 1, why: 'It’s a resource-based policy on the function.' },
    { q: 'Least-privilege Resource for PutItem:', a: ['"*"', '!GetAtt InvoicesTable.Arn', 'arn:aws:dynamodb:*:*:*', '!Ref AWS::AccountId'], c: 1, why: 'Scope to the table ARN.' },
    { q: 'What makes AWS::Serverless::Function valid?', a: ['Transform: AWS::Serverless-2016-10-31', 'A Condition', 'SAM CLI only', 'JSON format'], c: 0, why: 'The SAM transform expands it.' },
    { q: 'Pass the table name to code via…', a: ['Hard-coded string', 'Environment variable from !Ref', 'Tags', 'Outputs'], c: 1, why: 'Config via env vars.' }
  ],
  challenge: { task: 'Finish the app: FnRole may only dynamodb:PutItem on !GetAtt InvoicesTable.Arn (no "*"), the function gets TABLE_NAME from !Ref, add a Lambda::Permission for apigateway.amazonaws.com, and output ApiUrl = !GetAtt HttpApi.ApiEndpoint.',
    hint: Y('Resources:', '  InvoicesTable:', '    Type: AWS::DynamoDB::Table', '    Properties:', '      BillingMode: PAY_PER_REQUEST', '      AttributeDefinitions: [{ AttributeName: invoiceId, AttributeType: S }]', '      KeySchema: [{ AttributeName: invoiceId, KeyType: HASH }]', '  FnRole:', '    Type: AWS::IAM::Role', '    Properties:', '      AssumeRolePolicyDocument:', '        Statement:', '          - Effect: Allow', '            Principal: { Service: lambda.amazonaws.com }', '            Action: sts:AssumeRole', '      Policies:', '        - PolicyName: write-invoices', '          PolicyDocument:', '            Statement:', '              - Effect: Allow', '                Action: dynamodb:PutItem', '                Resource: !GetAtt InvoicesTable.Arn', '  CreateInvoiceFn:', '    Type: AWS::Lambda::Function', '    Properties:', '      Runtime: python3.12', '      Handler: index.handler', '      Role: !GetAtt FnRole.Arn', '      Code: { ZipFile: "def handler(e, c): return {\'statusCode\': 201}" }', '      Environment:', '        Variables:', '          TABLE_NAME: !Ref InvoicesTable', '  HttpApi:', '    Type: AWS::ApiGatewayV2::Api', '    Properties:', '      Name: invoices-api', '      ProtocolType: HTTP', '      Target: !GetAtt CreateInvoiceFn.Arn', '  ApiInvokePermission:', '    Type: AWS::Lambda::Permission', '    Properties:', '      Action: lambda:InvokeFunction', '      FunctionName: !Ref CreateInvoiceFn', '      Principal: apigateway.amazonaws.com', 'Outputs:', '  ApiUrl:', '    Value: !GetAtt HttpApi.ApiEndpoint'),
    starter: Y('Resources:', '  InvoicesTable:', '    Type: AWS::DynamoDB::Table', '    Properties:', '      BillingMode: PAY_PER_REQUEST', '      AttributeDefinitions: [{ AttributeName: invoiceId, AttributeType: S }]', '      KeySchema: [{ AttributeName: invoiceId, KeyType: HASH }]', '  FnRole:', '    Type: AWS::IAM::Role', '    Properties:', '      AssumeRolePolicyDocument:', '        Statement:', '          - Effect: Allow', '            Principal: { Service: lambda.amazonaws.com }', '            Action: sts:AssumeRole', '      Policies:', '        - PolicyName: write-invoices', '          PolicyDocument:', '            Statement:', '              - Effect: Allow', '                Action: "dynamodb:*"', '                Resource: "*"', '  CreateInvoiceFn:', '    Type: AWS::Lambda::Function', '    Properties:', '      Runtime: python3.12', '      Handler: index.handler', '      Role: !GetAtt FnRole.Arn', '      Code: { ZipFile: "def handler(e, c): return {\'statusCode\': 201}" }', '  HttpApi:', '    Type: AWS::ApiGatewayV2::Api', '    Properties:', '      Name: invoices-api', '      ProtocolType: HTTP', '      Target: !GetAtt CreateInvoiceFn.Arn'),
    check: r => { if (!r.ok) return 'deploy must succeed'; const role = RES(r, 'AWS::IAM::Role')[0]; const tbl = RES(r, 'AWS::DynamoDB::Table')[0];
      const st = [].concat(...(role.Properties.Policies || []).map(p => [].concat(p.PolicyDocument.Statement || [])));
      if (!st.length) return 'FnRole needs an inline policy';
      if (st.some(s => [].concat(s.Resource).includes('*') || [].concat(s.Action).some(a => /\*/.test(a)))) return 'no wildcards: Action dynamodb:PutItem, Resource !GetAtt InvoicesTable.Arn';
      if (!st.some(s => [].concat(s.Action).includes('dynamodb:PutItem') && [].concat(s.Resource).includes(tbl.attrs.Arn))) return 'allow dynamodb:PutItem on the table ARN';
      const f = RES(r, 'AWS::Lambda::Function')[0]; if (((f.Properties.Environment || {}).Variables || {}).TABLE_NAME !== tbl.ref) return 'set Environment Variables TABLE_NAME: !Ref InvoicesTable';
      const p = RES(r, 'AWS::Lambda::Permission')[0]; if (!p || p.Properties.Principal !== 'apigateway.amazonaws.com') return 'add AWS::Lambda::Permission (Action lambda:InvokeFunction, Principal apigateway.amazonaws.com)';
      return Object.values(r.outputs).some(o => /execute-api/.test(o.value)) ? true : 'output ApiUrl: !GetAtt HttpApi.ApiEndpoint'; } },
  next: `One stack is easy. Ten stacks across five accounts is the real job. Next: <b>nested stacks, cross-stack exports and StackSets</b>.`,
  cheat: [['BillingMode: PAY_PER_REQUEST', 'on-demand table'], ['Resource: !GetAtt Table.Arn', 'least privilege'], ['Lambda::Permission Principal apigateway.amazonaws.com', 'allow API to invoke'], ['!GetAtt HttpApi.ApiEndpoint', 'API URL'], ['Transform: AWS::Serverless-2016-10-31', 'SAM'], ['sam build && sam deploy --guided', 'SAM workflow']]
});
