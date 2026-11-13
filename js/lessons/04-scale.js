/* ============ 11 NESTED, CROSS-STACK, STACKSETS ============ */
LESSONS.push({
  id: 'multi-stack', num: 11, cat: 'adv', layer: 5, mins: 15,
  title: 'Nested Stacks, Cross-Stack & StackSets', short: 'Organize many stacks across accounts',
  overview: `<p>One giant template becomes unmanageable (and there's a 500-resource limit). Three ways to scale: <b>cross-stack references</b> (Export/ImportValue between independent stacks), <b>nested stacks</b> (a parent template that deploys child templates as resources) and <b>StackSets</b> (one template deployed to many accounts and regions).</p>`,
  hook: `<b>Cross-stack = neighbors sharing. Nested = parent with children. StackSets = franchise.</b>`,
  why: `Landing zones, security baselines (CloudTrail, Config, GuardDuty roles in every account) and shared networks are all built with these patterns. This is core Cloud Security engineering work.`,
  scene: { type: 'graph', nodes: [
    { id: 'net', x: 130, y: 120, icon: 'globe', label: 'raul-network', sub: 'Exports VpcId' },
    { id: 'app', x: 130, y: 380, icon: 'cloud', label: 'raul-app', sub: '!ImportValue VpcId' },
    { id: 'parent', x: 480, y: 120, icon: 'blueprint', label: 'Parent stack', sub: 'AWS::CloudFormation::Stack', at: 2 },
    { id: 'child', x: 480, y: 380, icon: 'code', label: 'Child stacks', sub: 'TemplateURL in S3', at: 2 },
    { id: 'mgmt', x: 800, y: 120, icon: 'users', label: 'StackSet (admin)', sub: 'Organizations', at: 3 },
    { id: 'accts', x: 800, y: 380, icon: 'server', label: 'Every account', sub: 'baseline stack instances', at: 3 }
  ], edges: [{ a: 'net', b: 'app' }, { a: 'parent', b: 'child' }, { a: 'mgmt', b: 'accts' }] },
  steps: [
    { t: 'Why split stacks?', sub: 'Lifecycle and ownership',
      body: `<p>Split by <b>lifecycle</b> and <b>owner</b>: the network changes rarely (network team), databases sometimes, app code daily. Separate stacks mean a broken app deploy can't touch the VPC, and permissions can be scoped per stack.</p>`,
      analogy: `A city has separate departments for <b>roads, water and shops</b>; you don't rebuild the roads to open a new shop.`,
      hook: `<b>Split by "who changes it and how often".</b>`,
      words: ['blast radius', 'lifecycle', 'ownership', '500 resource limit'],
      flow: { from: 'net', to: 'app', label: 'LAYERS', detail: ['network → data → app'], color: 'blue' }, focus: ['net', 'app'],
      cmds: [{ c: 'aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE --query "StackSummaries[].StackName" --output text', o: 'raul-network\traul-data\traul-app', k: 'cfn' }] },
    { t: 'Cross-stack references', sub: 'Export → ImportValue',
      body: `<p>The network stack exports <code>raul-network-VpcId</code>; the app stack uses <code>VpcId: !ImportValue raul-network-VpcId</code>. Loose coupling, but exports in use are locked (can't change or delete them). Alternative for more flexibility: store values in <b>SSM Parameter Store</b> and read them with parameter type <code>AWS::SSM::Parameter::Value&lt;String&gt;</code>.</p>`,
      analogy: `The network team posts the <b>map on the bulletin board</b>; app teams read it.`,
      hook: `<b>Exports lock. SSM parameters bend.</b>`,
      words: ['Fn::ImportValue', 'Export', 'list-imports', 'SSM Parameter Store', 'AWS::SSM::Parameter::Value'],
      flow: { from: 'net', to: 'app', label: 'IMPORT', detail: ['!ImportValue raul-network-VpcId'], color: 'purple' }, focus: ['net', 'app'],
      cmds: [{ c: 'aws cloudformation list-imports --export-name raul-network-VpcId', o: '{\n    "Imports": [\n        "raul-app"\n    ]\n}', k: 'cfn' }] },
    { t: 'Nested stacks', sub: 'AWS::CloudFormation::Stack',
      body: `<p>A parent template declares children as resources: <code>Type: AWS::CloudFormation::Stack</code> with <code>TemplateURL</code> (in S3) and <code>Parameters</code>. Child outputs are read with <code>!GetAtt NetworkStack.Outputs.VpcId</code>. Deploying the parent deploys all children together: one unit, one rollback.</p><p>Great for <b>reusable components</b> (a standard "secure bucket" module).</p>`,
      analogy: `<b>Russian dolls</b>: open the parent, the children come with it.`,
      hook: `<b>Nested = one deploy, many templates. GetAtt Child.Outputs.X.</b>`,
      words: ['nested stack', 'TemplateURL', 'Outputs.X', 'aws cloudformation package', 'module'],
      flow: { from: 'parent', to: 'child', label: 'DEPLOY', detail: ['NetworkStack, DataStack, AppStack'], color: 'amber' }, focus: ['parent', 'child'],
      cmds: [{ c: '  NetworkStack:\n    Type: AWS::CloudFormation::Stack\n    Properties:\n      TemplateURL: https://raul-artifacts.s3.amazonaws.com/network.yaml\n      Parameters:\n        Env: !Ref Env\n  AppStack:\n    Type: AWS::CloudFormation::Stack\n    Properties:\n      TemplateURL: https://raul-artifacts.s3.amazonaws.com/app.yaml\n      Parameters:\n        VpcId: !GetAtt NetworkStack.Outputs.VpcId', f: 'parent.yaml', o: '', k: 'tpl' }] },
    { t: 'StackSets', sub: 'Many accounts, many regions',
      body: `<p>A <b>StackSet</b> deploys one template as <b>stack instances</b> into target accounts/OUs and regions. With <b>service-managed</b> permissions (AWS Organizations), new accounts joining an OU get the stack automatically. Use it for security baselines: audit roles, Config rules, GuardDuty, log buckets.</p><p>Controls: max concurrent accounts, failure tolerance, region order.</p>`,
      analogy: `A <b>franchise manual</b>: every new branch opens with the same setup, automatically.`,
      hook: `<b>StackSet → instances in every account × region.</b>`,
      words: ['StackSet', 'stack instance', 'service-managed', 'OU', 'auto-deployment', 'failure tolerance'],
      flow: { from: 'mgmt', to: 'accts', label: 'ROLL OUT', detail: ['baseline → 12 accounts × 2 regions'], color: 'green' }, focus: ['mgmt', 'accts'],
      cmds: [{ c: 'aws cloudformation create-stack-instances --stack-set-name security-baseline --deployment-targets OrganizationalUnitIds=ou-ab12-workloads --regions ap-southeast-1 us-east-1 --operation-preferences MaxConcurrentPercentage=25,FailureTolerancePercentage=10', o: '{\n    "OperationId": "d1c2b3a4-…"\n}', k: 'cfn' }] },
    { t: 'Modules & registry', sub: 'Reuse, don’t copy-paste',
      body: `<p>Options for reusable building blocks: nested stacks, <b>CloudFormation modules</b> (registry type <code>Raul::S3::SecureBucket::MODULE</code>), <b>CDK constructs</b>, <b>Terraform modules</b>, and AWS-provided <b>Service Catalog</b> products for self-service. Pick one standard per team.</p>`,
      analogy: `<b>LEGO bricks</b> instead of carving every piece from wood.`,
      hook: `<b>Copy-paste is a bug waiting to diverge.</b>`,
      words: ['modules', 'CloudFormation registry', 'Service Catalog', 'constructs', 'golden templates'],
      flow: { from: 'child', to: 'parent', label: 'REUSE', detail: ['SecureBucket module in 14 stacks'], color: 'teal' },
      cmds: [{ c: 'aws cloudformation list-types --visibility PRIVATE --type MODULE --query "TypeSummaries[].TypeName"', o: '[\n    "Raul::S3::SecureBucket::MODULE"\n]', k: 'cfn' }] }
  ],
  summary: { title: 'You can scale CloudFormation', sub: 'Cross-stack · nested · StackSets · modules', text: `<p>Split stacks by lifecycle/owner. Share values with Export/ImportValue (locked while used) or SSM parameters. Nested stacks deploy child templates as one unit (<code>!GetAtt Child.Outputs.X</code>). StackSets push one template to many accounts/regions, ideal for security baselines.</p>` },
  quiz: [
    { q: 'Read a nested child stack’s output:', a: ['!ImportValue Child.X', '!GetAtt ChildStack.Outputs.X', '!Ref Child.X', '!FindInMap'], c: 1, why: 'Outputs become attributes.' },
    { q: 'Deploy a security baseline to every account in an OU:', a: ['Nested stacks', 'StackSets (service-managed)', 'Exports', 'Change sets'], c: 1, why: 'StackSets target OUs and regions.' },
    { q: 'Downside of Export/ImportValue:', a: ['Slow', 'Exports in use can’t be changed or deleted', 'Cross-region only', 'Costs money'], c: 1, why: 'Tight lock between stacks.' },
    { q: 'Good reason to split stacks:', a: ['Different lifecycles and owners', 'Fewer files', 'YAML limits', 'Avoid parameters'], c: 0, why: 'Smaller blast radius.' }
  ],
  challenge: { task: 'Make this an app stack that plugs into the network stack: WebSG.VpcId must be !ImportValue raul-network-VpcId (not hard-coded), and export the SG ID as !Sub "${AWS::StackName}-WebSG".',
    hint: Y('Resources:', '  WebSG:', '    Type: AWS::EC2::SecurityGroup', '    Properties:', '      GroupDescription: HTTPS from anywhere', '      VpcId: !ImportValue raul-network-VpcId', '      SecurityGroupIngress:', '        - IpProtocol: tcp', '          FromPort: 443', '          ToPort: 443', '          CidrIp: 0.0.0.0/0', 'Outputs:', '  WebSGId:', '    Value: !GetAtt WebSG.GroupId', '    Export:', '      Name: !Sub "${AWS::StackName}-WebSG"'),
    starter: Y('Resources:', '  WebSG:', '    Type: AWS::EC2::SecurityGroup', '    Properties:', '      GroupDescription: HTTPS from anywhere', '      VpcId: vpc-0abc123def4567890', '      SecurityGroupIngress:', '        - IpProtocol: tcp', '          FromPort: 443', '          ToPort: 443', '          CidrIp: 0.0.0.0/0'),
    check: r => { if (!r.ok) return 'deploy must succeed'; const sg = RES(r, 'AWS::EC2::SecurityGroup')[0]; if (!sg) return 'keep WebSG';
      if (sg.Properties.VpcId !== 'imported:raul-network-VpcId') return 'VpcId must be !ImportValue raul-network-VpcId';
      return Object.values(r.outputs).some(o => o.export === 'raul-stack-WebSG') ? true : 'add an Output with Export Name !Sub "${AWS::StackName}-WebSG"'; } },
  next: `Templates are code, so treat them like code: lint, scan, review and deploy from a pipeline. Next: <b>IaC security</b>: cfn-lint, cfn-guard, Checkov and secrets done right.`,
  cheat: [['!ImportValue name', 'cross-stack'], ['AWS::CloudFormation::Stack TemplateURL', 'nested stack'], ['!GetAtt Child.Outputs.X', 'child output'], ['create-stack-set / create-stack-instances', 'multi-account'], ['service-managed + OU', 'auto-deploy new accounts'], ['AWS::SSM::Parameter::Value<String>', 'flexible sharing']]
});

/* ============ 12 IaC SECURITY & CI ============ */
LESSONS.push({
  id: 'iac-security', num: 12, cat: 'ops', layer: 5, mins: 17,
  title: 'IaC Security: Lint, Scan, Secrets, Pipelines', short: 'Shift-left security for templates',
  overview: `<p>Because infrastructure is code, you can check it <b>before</b> it exists: <b>cfn-lint</b> for correctness, <b>cfn-guard</b>/<b>Checkov</b> for security policy, <b>dynamic references</b> so secrets never live in templates, and a <b>pipeline</b> with a least-privilege <b>service role</b> so humans don't need admin rights.</p>`,
  hook: `<b>"Lint, Guard, Secret, Pipeline": "Let Guards Seal Pipelines."</b>`,
  why: `Misconfigurations (public buckets, open security groups, wildcard IAM) cause most cloud breaches. Catching them in a pull request costs seconds; catching them in production costs headlines. This is the heart of a Cloud Security role.`,
  scene: { type: 'graph', nodes: [
    { id: 'pr', x: 90, y: 240, icon: 'code', label: 'Pull request', sub: 'template.yaml' },
    { id: 'lint', x: 280, y: 110, icon: 'search', label: 'cfn-lint', sub: 'valid?', at: 1 },
    { id: 'guard', x: 280, y: 370, icon: 'shield', label: 'cfn-guard / Checkov', sub: 'secure?' },
    { id: 'sec', x: 510, y: 370, icon: 'vault', label: 'Secrets Manager', sub: '{{resolve:…}}', at: 3 },
    { id: 'pipe', x: 510, y: 110, icon: 'pipe', label: 'Pipeline', sub: 'change set + approval', at: 2 },
    { id: 'role', x: 760, y: 110, icon: 'key', label: 'CFN service role', sub: 'least privilege', at: 4 },
    { id: 'aws', x: 760, y: 370, icon: 'cloud', label: 'Stack', sub: 'compliant', at: 3 }
  ], edges: [{ a: 'pr', b: 'lint' }, { a: 'pr', b: 'guard' }, { a: 'lint', b: 'pipe' }, { a: 'guard', b: 'pipe' }, { a: 'sec', b: 'aws' }, { a: 'pipe', b: 'role' }, { a: 'role', b: 'aws' }] },
  steps: [
    { t: 'Common template misconfigs', sub: 'What scanners look for',
      body: `<p>Top findings: S3 without <b>Block Public Access</b> or <b>encryption</b>; security groups with <code>0.0.0.0/0</code> on 22/3389; IAM with <code>Action: "*"</code> or <code>Resource: "*"</code>; unencrypted RDS/EBS; logging disabled; hard-coded passwords and keys; no DeletionPolicy on data.</p>`,
      analogy: `A <b>building inspector's checklist</b>: smoke alarms, exits, wiring, before people move in.`,
      hook: `<b>Public · Unencrypted · Wildcard · Open port · Hard-coded secret.</b>`,
      words: ['misconfiguration', 'Block Public Access', 'encryption at rest', 'wildcard IAM', 'open SSH'],
      flow: { from: 'pr', to: 'guard', label: 'RISKS', detail: ['S3 public · SG 22 open · Action "*"'], color: 'red' }, focus: ['pr'],
      cmds: [{ c: 'checkov -f template.yaml --compact --quiet', o: 'Check: CKV_AWS_53: "Ensure S3 bucket has block public ACLS enabled"\n\tFAILED for resource: AWS::S3::Bucket.ReportsBucket\nCheck: CKV_AWS_24: "Ensure no security groups allow ingress from 0.0.0.0:0 to port 22"\n\tFAILED for resource: AWS::EC2::SecurityGroup.AdminSG', k: 'err', f: 'terminal' }] },
    { t: 'cfn-lint', sub: 'Is it valid?',
      body: `<p><code>cfn-lint</code> checks templates against the CloudFormation spec: wrong property names, invalid values, bad references, deprecated runtimes. It catches most deploy failures in seconds, locally or in CI. Errors are <b>E</b>, warnings <b>W</b>.</p>`,
      analogy: `<b>Spell-check</b> for templates.`,
      hook: `<b>Lint before you deploy. Every time.</b>`,
      words: ['cfn-lint', 'E3002', 'W', 'pre-commit hook'],
      flow: { from: 'pr', to: 'lint', label: 'LINT', detail: ['E3002 Invalid Property Resources/Fn/Properties/Memory'], color: 'amber' }, focus: ['pr', 'lint'],
      cmds: [{ c: 'cfn-lint template.yaml', o: 'E3002 Additional properties are not allowed (\'Memory\' was unexpected)\ntemplate.yaml:24:7\nW2531 Runtime \'python3.8\' was deprecated', k: 'err', f: 'terminal' }] },
    { t: 'Policy as code', sub: 'cfn-guard, Checkov, Hooks',
      body: `<p><b>cfn-guard</b> rules are your organization's policy in code:</p><p><code>AWS::S3::Bucket { Properties.BucketEncryption exists }</code></p><p><b>Checkov</b> and <b>KICS</b> ship hundreds of built-in checks (CFN, Terraform, Kubernetes, Dockerfiles). <b>CloudFormation Hooks</b> enforce rules at deploy time inside AWS, even for people who skip CI.</p>`,
      analogy: `House rules written on the wall, and a <b>bouncer</b> (Hooks) at the door checking them.`,
      hook: `<b>Guard in the PR, Hooks at the door.</b>`,
      words: ['cfn-guard', 'Checkov', 'KICS', 'CloudFormation Hooks', 'policy as code'],
      flow: { from: 'guard', to: 'pipe', label: 'GATE', detail: ['FAIL → block merge'], color: 'purple' }, focus: ['guard', 'pipe'],
      cmds: [{ c: 'cfn-guard validate --data template.yaml --rules s3-security.guard', o: 'template.yaml Status = FAIL\nFAILED rules\ns3-security.guard/bucket_encrypted    FAIL\n  Resource = ReportsBucket  Missing Properties.BucketEncryption', k: 'err', f: 'terminal' }] },
    { t: 'Secrets: dynamic references', sub: 'Never commit a password',
      body: `<p>Anything in a template ends up in Git history, change sets and maybe outputs. Instead use <b>dynamic references</b> resolved at deploy time:</p><p><code>'{{resolve:secretsmanager:prod/db:SecretString:password}}'</code><br><code>'{{resolve:ssm-secure:/prod/api-key}}'</code></p><p>Or let the service create and own the secret: <code>AWS::SecretsManager::Secret</code> with <code>GenerateSecretString</code>, or RDS <code>ManageMasterUserPassword: true</code>.</p>`,
      analogy: `Writing "<b>the key is in the safe, combination on file</b>" instead of taping the key to the blueprint.`,
      hook: `<b>Reference the secret, never paste it.</b>`,
      words: ['dynamic reference', 'resolve:secretsmanager', 'resolve:ssm-secure', 'GenerateSecretString', 'NoEcho'],
      flow: { from: 'sec', to: 'aws', label: 'RESOLVE', detail: ['{{resolve:secretsmanager:prod/db:…}}'], color: 'green' }, focus: ['sec', 'aws'],
      cmds: [{ c: '      Environment:\n        Variables:\n          DB_PASSWORD: "{{resolve:secretsmanager:prod/db:SecretString:password}}"', f: 'template.yaml', o: '', k: 'tpl' }] },
    { t: 'Pipeline + service role', sub: 'Humans don’t deploy prod',
      body: `<p>Flow: PR → lint + scan → review → merge → pipeline creates a <b>change set</b> → manual approval for prod → execute. CloudFormation runs with a <b>service role</b> (<code>--role-arn</code>) holding the deploy permissions, so developers only need <code>cloudformation:*</code> + <code>iam:PassRole</code> on that role, not admin.</p><p>Plus: stack policies, termination protection, and drift detection on a schedule.</p>`,
      analogy: `Only the <b>licensed contractor</b> (service role) gets the master keys; you hand them the approved blueprint.`,
      hook: `<b>Pipeline deploys. Service role acts. Humans approve.</b>`,
      words: ['service role', '--role-arn', 'iam:PassRole', 'manual approval', 'GitHub Actions OIDC'],
      flow: { from: 'pipe', to: 'role', label: 'DEPLOY AS', detail: ['--role-arn arn:aws:iam::…:role/cfn-deployer'], color: 'teal' }, focus: ['pipe', 'role', 'aws'],
      cmds: [{ c: 'aws cloudformation deploy --template-file template.yaml --stack-name raul-prod --role-arn arn:aws:iam::111122223333:role/cfn-deployer', o: '\nSuccessfully created/updated stack - raul-prod', k: 'cfn' }],
      cloud: `<b>Link</b>: CI/CD Explorer builds this pipeline with GitHub Actions + OIDC.` }
  ],
  summary: { title: 'Your templates are secure by default', sub: 'Lint · scan · secrets · pipeline', text: `<p>Run cfn-lint for validity and cfn-guard/Checkov for security policy in every PR; enforce at deploy time with Hooks. Keep secrets out of templates with dynamic references or service-generated secrets. Deploy prod only from a pipeline using change sets, approvals and a least-privilege CloudFormation service role.</p>` },
  quiz: [
    { q: 'Keep a DB password out of the template:', a: ['NoEcho parameter with a Default', '{{resolve:secretsmanager:…}}', 'Base64 it', 'Put it in Outputs'], c: 1, why: 'Dynamic references resolve at deploy time.' },
    { q: 'Tool that enforces your org’s rules on templates:', a: ['cfn-guard', 'sam local', 'aws configure', 'jq'], c: 0, why: 'Policy as code (also Checkov).' },
    { q: 'CloudFormation service role means…', a: ['Humans need admin', 'CFN acts with that role’s permissions', 'No IAM needed', 'Only for StackSets'], c: 1, why: 'Developers just need PassRole.' },
    { q: 'Which is a high-risk finding?', a: ['Tags missing', 'SG allows 0.0.0.0/0 on port 22', 'Description missing', 'PAY_PER_REQUEST'], c: 1, why: 'Open SSH to the world.' }
  ],
  challenge: { task: 'Harden it like a scanner would demand: ReportsBucket needs BucketEncryption (SSEAlgorithm aws:kms) and PublicAccessBlockConfiguration with all four settings true; AdminSG must not allow port 22 from 0.0.0.0/0 (allow 443 instead); DB_PASSWORD must be a {{resolve:secretsmanager:…}} dynamic reference.',
    hint: Y('Resources:', '  ReportsBucket:', '    Type: AWS::S3::Bucket', '    Properties:', '      BucketEncryption:', '        ServerSideEncryptionConfiguration:', '          - ServerSideEncryptionByDefault:', '              SSEAlgorithm: aws:kms', '      PublicAccessBlockConfiguration:', '        BlockPublicAcls: true', '        BlockPublicPolicy: true', '        IgnorePublicAcls: true', '        RestrictPublicBuckets: true', '  AdminSG:', '    Type: AWS::EC2::SecurityGroup', '    Properties:', '      GroupDescription: web', '      SecurityGroupIngress:', '        - IpProtocol: tcp', '          FromPort: 443', '          ToPort: 443', '          CidrIp: 0.0.0.0/0', '  FnRole:', '    Type: AWS::IAM::Role', '    Properties:', '      AssumeRolePolicyDocument:', '        Statement:', '          - Effect: Allow', '            Principal: { Service: lambda.amazonaws.com }', '            Action: sts:AssumeRole', '  ReportFn:', '    Type: AWS::Lambda::Function', '    Properties:', '      Runtime: python3.12', '      Handler: index.handler', '      Role: !GetAtt FnRole.Arn', '      Code: { ZipFile: "def handler(e, c): return 1" }', '      Environment:', '        Variables:', '          DB_PASSWORD: "{{resolve:secretsmanager:prod/db:SecretString:password}}"'),
    starter: Y('Resources:', '  ReportsBucket:', '    Type: AWS::S3::Bucket', '  AdminSG:', '    Type: AWS::EC2::SecurityGroup', '    Properties:', '      GroupDescription: admin', '      SecurityGroupIngress:', '        - IpProtocol: tcp', '          FromPort: 22', '          ToPort: 22', '          CidrIp: 0.0.0.0/0', '  FnRole:', '    Type: AWS::IAM::Role', '    Properties:', '      AssumeRolePolicyDocument:', '        Statement:', '          - Effect: Allow', '            Principal: { Service: lambda.amazonaws.com }', '            Action: sts:AssumeRole', '  ReportFn:', '    Type: AWS::Lambda::Function', '    Properties:', '      Runtime: python3.12', '      Handler: index.handler', '      Role: !GetAtt FnRole.Arn', '      Code: { ZipFile: "def handler(e, c): return 1" }', '      Environment:', '        Variables:', '          DB_PASSWORD: Sup3rS3cret!'),
    check: r => { if (!r.ok) return 'deploy must succeed'; const b = RES(r, 'AWS::S3::Bucket')[0].Properties;
      const enc = JSON.stringify(b.BucketEncryption || {}); if (!/aws:kms/.test(enc)) return 'add BucketEncryption → ServerSideEncryptionConfiguration → ServerSideEncryptionByDefault → SSEAlgorithm: aws:kms';
      const pab = b.PublicAccessBlockConfiguration || {}; for (const k of ['BlockPublicAcls', 'BlockPublicPolicy', 'IgnorePublicAcls', 'RestrictPublicBuckets']) if (String(pab[k]) !== 'true') return 'PublicAccessBlockConfiguration.' + k + ' must be true';
      for (const sg of RES(r, 'AWS::EC2::SecurityGroup')) for (const ing of [].concat(sg.Properties.SecurityGroupIngress || [])) if (ing.CidrIp === '0.0.0.0/0' && Number(ing.FromPort) <= 22 && Number(ing.ToPort) >= 22) return 'port 22 is open to 0.0.0.0/0. Remove it (use SSM Session Manager)';
      const pw = ((RES(r, 'AWS::Lambda::Function')[0].Properties.Environment || {}).Variables || {}).DB_PASSWORD || '';
      return /^\{\{resolve:secretsmanager:/.test(pw) ? true : 'DB_PASSWORD must be "{{resolve:secretsmanager:prod/db:SecretString:password}}"'; } },
  next: `Last lesson: CloudFormation isn't the only IaC tool. See how the same bucket looks in <b>Terraform</b> and <b>CDK</b>, and when you'd pick each.`,
  cheat: [['cfn-lint template.yaml', 'validate'], ['cfn-guard validate --data t.yaml --rules r.guard', 'policy check'], ['checkov -f template.yaml', 'security scan'], ['{{resolve:secretsmanager:id:SecretString:key}}', 'secret reference'], ['--role-arn …cfn-deployer', 'service role'], ['CloudFormation Hooks', 'deploy-time enforcement']]
});

/* ============ 13 TERRAFORM & CDK ============ */
LESSONS.push({
  id: 'tf-cdk', num: 13, cat: 'tf', layer: 6, mins: 16,
  title: 'Terraform & CDK Compared', short: 'Same infra, different tools',
  overview: `<p>The concepts you learned (declarative resources, references, dependencies, state, plans, modules) transfer directly. <b>Terraform</b> uses HCL and a state file you manage; <b>CDK</b> lets you write TypeScript/Python that synthesizes CloudFormation. Knowing all three makes you hireable anywhere.</p>`,
  hook: `<b>change set = terraform plan = cdk diff.</b> Same idea, three dialects.`,
  why: `Job posts split roughly between Terraform and CloudFormation/CDK. Interviewers love "compare CloudFormation and Terraform", and you'll answer from experience.`,
  scene: { type: 'graph', nodes: [
    { id: 'cfn', x: 160, y: 110, icon: 'code', label: 'CloudFormation', sub: 'YAML · AWS-managed state' },
    { id: 'tf', x: 160, y: 380, icon: 'blueprint', label: 'Terraform', sub: 'HCL · state file' },
    { id: 'cdk', x: 480, y: 110, icon: 'script', label: 'CDK', sub: 'TS/Python → CFN', at: 3 },
    { id: 'state', x: 480, y: 380, icon: 'disk', label: 'S3 state + lock', sub: 'terraform.tfstate', at: 2 },
    { id: 'aws', x: 800, y: 240, icon: 'cloud', label: 'AWS', sub: 'same resources' }
  ], edges: [{ a: 'cfn', b: 'aws' }, { a: 'tf', b: 'state' }, { a: 'state', b: 'aws' }, { a: 'cdk', b: 'cfn' }, { a: 'tf', b: 'aws' }] },
  steps: [
    { t: 'Terraform basics', sub: 'Providers, resources, references',
      body: `<p><code>resource "aws_s3_bucket" "reports" { bucket = "raul-reports" }</code>. References look like <code>aws_s3_bucket.reports.arn</code> (like !GetAtt). <b>Providers</b> (aws, azurerm, google, github, cloudflare…) make Terraform multi-cloud, and multi-SaaS.</p>`,
      analogy: `Same <b>recipe</b>, written in a different <b>language</b>.`,
      hook: `<b>type.name.attribute = Terraform's !GetAtt.</b>`,
      words: ['HCL', 'provider', 'resource', 'aws_s3_bucket', 'variable', 'output'],
      flow: { from: 'tf', to: 'aws', label: 'HCL', detail: ['aws_s3_bucket.reports'], color: 'purple' }, focus: ['tf', 'aws'],
      cmds: [{ c: 'resource "aws_s3_bucket" "reports" {\n  bucket = "raul-${var.env}-reports"\n}\n\nresource "aws_s3_bucket_versioning" "reports" {\n  bucket = aws_s3_bucket.reports.id\n  versioning_configuration { status = "Enabled" }\n}', f: 'main.tf', o: '', k: 'tpl' }] },
    { t: 'init · plan · apply', sub: 'The Terraform workflow',
      body: `<p><code>terraform init</code> downloads providers; <code>terraform plan</code> shows <code>+ create</code>, <code>~ update</code>, <code>-/+ replace</code>, <code>- destroy</code> (= change set); <code>terraform apply</code> executes. No automatic rollback: a failed apply leaves partial changes, and you fix and re-apply.</p>`,
      analogy: `<b>Plan</b> is the quote from the contractor; <b>apply</b> is signing it.`,
      hook: `<b>init → plan → apply. "-/+" means replace!</b>`,
      words: ['terraform init', 'terraform plan', 'terraform apply', '-/+ replace', 'no auto-rollback'],
      flow: { from: 'tf', to: 'aws', label: 'PLAN', detail: ['Plan: 2 to add, 0 to change, 0 to destroy.'], color: 'blue' }, focus: ['tf'],
      cmds: [{ c: 'terraform plan', o: '  # aws_s3_bucket.reports will be created\n  + resource "aws_s3_bucket" "reports" {\n      + bucket = "raul-dev-reports"\n    }\n\nPlan: 2 to add, 0 to change, 0 to destroy.', k: 'tool', f: 'terminal' }] },
    { t: 'State', sub: 'Terraform’s memory',
      body: `<p>Terraform records what it manages in <code>terraform.tfstate</code>. Teams store it remotely (S3 backend with locking, Terraform Cloud) and <b>protect it</b>: it can contain secrets in plain text. CloudFormation keeps state inside AWS for you, one less thing to secure, but less flexible.</p><p>Drift: <code>terraform plan</code> shows it; <code>terraform import</code> adopts existing resources.</p>`,
      analogy: `State is the <b>inventory list</b>. Lose it and Terraform forgets what it owns.`,
      hook: `<b>Remote state, locked, encrypted, never in Git.</b>`,
      words: ['tfstate', 'S3 backend', 'state locking', 'terraform import', 'sensitive state'],
      flow: { from: 'state', to: 'aws', label: 'STATE', detail: ['s3://raul-tfstate/prod.tfstate (locked)'], color: 'amber' }, focus: ['tf', 'state'],
      cmds: [{ c: 'terraform {\n  backend "s3" {\n    bucket       = "raul-tfstate"\n    key          = "prod/terraform.tfstate"\n    region       = "ap-southeast-1"\n    encrypt      = true\n    use_lockfile = true\n  }\n}', f: 'backend.tf', o: '', k: 'tpl' }] },
    { t: 'CDK', sub: 'Real code → CloudFormation',
      body: `<p>CDK apps use loops, functions and types, and high-level <b>constructs</b> with secure defaults: <code>bucket.grantRead(fn)</code> writes the least-privilege IAM policy for you. <code>cdk synth</code> outputs CloudFormation; <code>cdk diff</code> = change set; <code>cdk deploy</code> deploys. Everything you learned about stacks, rollback and DeletionPolicy still applies.</p>`,
      analogy: `CDK is a <b>translator</b> that writes the YAML recipe from your Python.`,
      hook: `<b>CDK writes CloudFormation; grant*() writes IAM.</b>`,
      words: ['CDK', 'construct', 'cdk synth', 'cdk diff', 'cdk deploy', 'grantRead'],
      flow: { from: 'cdk', to: 'cfn', label: 'SYNTH', detail: ['cdk.out/RaulStack.template.json'], color: 'green' }, focus: ['cdk', 'cfn'],
      cmds: [{ c: 'bucket = s3.Bucket(self, "Reports", versioned=True,\n    encryption=s3.BucketEncryption.KMS_MANAGED,\n    block_public_access=s3.BlockPublicAccess.BLOCK_ALL,\n    removal_policy=RemovalPolicy.RETAIN)\nbucket.grant_read(report_fn)', f: 'app_stack.py', o: '', k: 'tpl' }] },
    { t: 'Which one when?', sub: 'Decision guide',
      body: `<p><b>CloudFormation/SAM</b>: AWS-only shops, no state to manage, StackSets, day-one support for new services via the registry. <b>CDK</b>: developers who prefer code, complex logic, reusable constructs. <b>Terraform/OpenTofu</b>: multi-cloud or many SaaS providers, a huge module ecosystem, common in consulting.</p><p>Mixing is normal. The real skill is the concepts, plus security scanning in every one (Checkov scans all three).</p>`,
      analogy: `Choosing between <b>hand tools, power tools, and a universal toolkit</b>: depends on the job site.`,
      hook: `<b>AWS-only → CFN/CDK. Many clouds → Terraform. Concepts → everywhere.</b>`,
      words: ['multi-cloud', 'OpenTofu', 'ecosystem', 'team skills', 'concept transfer'],
      flow: { from: 'cfn', to: 'aws', label: 'SAME END', detail: ['bucket · role · function · VPC'], color: 'teal' }, focus: ['cfn', 'tf', 'cdk', 'aws'],
      cmds: [{ c: 'cdk diff', o: 'Stack RaulStack\nResources\n[+] AWS::S3::Bucket Reports ReportsE5A4C1D2\n[+] AWS::IAM::Policy ReportFnServiceRoleDefaultPolicy', k: 'tool', f: 'terminal' }] }
  ],
  summary: { title: 'You speak three IaC dialects', sub: 'CloudFormation · Terraform · CDK', text: `<p>Terraform: HCL, providers, <code>init/plan/apply</code>, a state file you must store remotely and protect, no automatic rollback. CDK: real code and constructs that synthesize CloudFormation (<code>cdk synth/diff/deploy</code>). Same concepts everywhere: declarative resources, references, plans/change sets, modules, security scanning.</p>` },
  quiz: [
    { q: 'Terraform’s equivalent of a change set:', a: ['terraform init', 'terraform plan', 'terraform fmt', 'terraform state'], c: 1, why: 'Plan previews changes.' },
    { q: 'Where should Terraform state live for a team?', a: ['Git repo', 'Remote backend (e.g. S3) with locking & encryption', 'Laptop', 'Outputs'], c: 1, why: 'Shared, locked, protected.' },
    { q: 'CDK deploys using…', a: ['Terraform', 'CloudFormation (synthesized)', 'Direct API calls', 'SAM CLI only'], c: 1, why: 'cdk synth → CFN template.' },
    { q: 'In terraform plan, "-/+" means…', a: ['No change', 'Replace (destroy then create)', 'Import', 'Read'], c: 1, why: 'Like Replacement: True.' }
  ],
  challenge: { task: 'Translate this Terraform into CloudFormation: an SQS queue OrdersDLQ, and OrdersQueue with VisibilityTimeout 60 and a RedrivePolicy (deadLetterTargetArn = !GetAtt OrdersDLQ.Arn, maxReceiveCount 5).\n\nresource "aws_sqs_queue" "dlq" {}\nresource "aws_sqs_queue" "orders" {\n  visibility_timeout_seconds = 60\n  redrive_policy = jsonencode({ deadLetterTargetArn = aws_sqs_queue.dlq.arn, maxReceiveCount = 5 })\n}',
    hint: Y('Resources:', '  OrdersDLQ:', '    Type: AWS::SQS::Queue', '  OrdersQueue:', '    Type: AWS::SQS::Queue', '    Properties:', '      VisibilityTimeout: 60', '      RedrivePolicy:', '        deadLetterTargetArn: !GetAtt OrdersDLQ.Arn', '        maxReceiveCount: 5'),
    starter: Y('# Terraform → CloudFormation', 'Resources:', '  OrdersQueue:', '    Type: AWS::SQS::Queue', '    Properties:', '      VisibilityTimeout: 60'),
    check: r => { if (!r.ok) return 'deploy must succeed'; const qs = RES(r, 'AWS::SQS::Queue'); if (qs.length < 2) return 'you need two queues: OrdersDLQ and OrdersQueue';
      const main = qs.find(q => q.Properties.RedrivePolicy); if (!main) return 'add RedrivePolicy to OrdersQueue';
      const rp = main.Properties.RedrivePolicy; const dlq = qs.find(q => q !== main);
      if (rp.deadLetterTargetArn !== dlq.attrs.Arn) return 'deadLetterTargetArn must be !GetAtt OrdersDLQ.Arn';
      if (Number(rp.maxReceiveCount) !== 5) return 'maxReceiveCount should be 5';
      return Number(main.Properties.VisibilityTimeout) === 60 ? true : 'VisibilityTimeout should be 60'; } },
  next: `🎓 <b>Course complete!</b> Capstone: deploy the network stack (lesson 9) and the serverless app (lesson 10) to your own account from a GitHub Actions pipeline with cfn-lint + Checkov gates. Continue with <b>Serverless Explorer</b> to go deep on Lambda, API Gateway, EventBridge and Step Functions.`,
  cheat: [['terraform init / plan / apply', 'TF workflow'], ['type.name.attr', 'TF reference'], ['backend "s3" { encrypt, use_lockfile }', 'remote state'], ['cdk synth / diff / deploy', 'CDK workflow'], ['bucket.grantRead(fn)', 'CDK least privilege'], ['checkov -d .', 'scan CFN + TF + CDK out']]
});
