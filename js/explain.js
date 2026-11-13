window.EXPLAIN = {
"what-is-iac": [
 ["Declarative IaC (CloudFormation, Terraform) describes the end state you want; the tool figures out which API calls to make and in what order. Imperative scripts list every step yourself.", ["Listing every call in order is imperative scripting (CLI/boto3).", null, "Templates describe resources; cost is a side effect.", "IAM is just one of many resource types you can declare."]],
 ["IaC is idempotent: the tool compares the template with what exists and applies only the differences. An unchanged template means \"No changes to deploy\".", ["Existing resources are recognized by logical ID, so nothing is duplicated.", null, "Deleting only happens if you remove resources or delete the stack.", "Re-deploying an unchanged template is safe and succeeds."]],
 ["Drift is when the real resource no longer matches the template, usually because someone changed it by hand. Detect it with detect-stack-drift and fix it in code.", [null, "Manual changes don't create stacks.", "The template never updates itself; you must change the code.", "The stack is now out of sync, which is a real risk."]],
 ["CloudFormation is AWS's own IaC service, and AWS manages the stack state for you. SAM and CDK both generate CloudFormation.", ["Terraform is HashiCorp's multi-cloud tool.", null, "Ansible is mainly configuration management.", "Pulumi is a third-party IaC tool using general-purpose languages."]]
],
"first-template": [
 ["Resources is the only required section: a template must declare at least one resource. Parameters, Outputs, Mappings, Conditions and Description are optional.", ["Parameters are optional inputs.", "Outputs are optional return values.", null, "Description is optional documentation."]],
 ["\"2010-09-09\" is the only valid CloudFormation template version. Don't confuse it with \"2012-10-17\", the IAM policy language version.", ["That's the IAM policy Version, not the template version.", null, "There's no \"latest\" value.", "\"v1\" isn't valid."]],
 ["The logical ID (like ReportsBucket) is your name for the resource inside the template, used by !Ref and !GetAtt. AWS generates the physical ID (the real name).", ["The AWS-generated name is the physical ID.", null, "ARNs are attributes you retrieve with !GetAtt.", "Region comes from where the stack is deployed."]],
 ["Resource types follow AWS::Service::Resource, for example AWS::S3::Bucket or AWS::Lambda::Function.", ["That format isn't used by CloudFormation.", null, "aws_s3_bucket is Terraform syntax.", "Types always include the AWS:: and service namespaces."]]
],
"yaml": [
 ["YAML indentation must use spaces; tabs are invalid and cause parse errors. Two spaces per level is the convention in CloudFormation.", ["Tabs break YAML parsing.", null, "Only spaces are allowed for indentation.", "Indentation is how YAML expresses structure."]],
 ["The literal block scalar | keeps line breaks exactly, which is ideal for scripts, UserData and inline policies.", ["> folds lines into one long line (newlines become spaces).", null, "# starts a comment.", "& defines a YAML anchor."]],
 ["!GetAtt Bucket.Arn is shorthand for Fn::GetAtt: [Bucket, Arn], a list of logical ID and attribute name. The long form helps when nesting functions.", [null, "Ref takes only a logical ID or parameter, no attribute.", "Fn::Sub builds strings; it isn't GetAtt.", "That isn't valid CloudFormation."]],
 ["This parser error almost always means indentation or a missing space after a colon: YAML found a key: value where it didn't expect one. Check the reported line.", ["Region problems give AWS validation errors, not YAML errors.", null, "IAM errors appear during deployment, not parsing.", "Unsupported types give \"Unrecognized resource types\"."]]
],
"params-outputs": [
 ["A parameter with no Default must be given a value at deploy time; otherwise CloudFormation fails with \"Parameters: [X] must have values\" before creating anything.", ["It doesn't silently become an empty string.", null, "There's no implicit default value.", "CloudFormation validates every parameter."]],
 ["Both work: AllowedValues: [dev, prod] gives a dropdown and clear errors, and an AllowedPattern regex also validates. AllowedValues is clearer for fixed choices.", ["This works too (as a regex match), so on its own it's an incomplete answer.", "This works too, so on its own it's an incomplete answer.", "NoEcho only masks the value in output; it doesn't validate.", null]],
 ["AWS::AccountId returns the 12-digit account ID. Pseudo parameters are always available without declaring them.", ["AWS::Region returns the Region code, e.g. ap-southeast-1.", null, "AWS::StackId returns the stack's ARN.", "AWS::Partition returns aws, aws-cn or aws-us-gov."]],
 ["An export can't be changed or deleted while any stack imports it with !ImportValue. Remove the imports first, which is a common source of stuck updates.", ["Exports are regional, but that isn't what locks them.", null, "Descriptions don't affect exports.", "Exports with no importers can be changed or deleted."]]
],
"intrinsics": [
 ["The Lambda Role property needs the role's ARN, which !GetAtt LambdaRole.Arn returns. !Ref on a role returns its name, a classic beginner bug.", ["!Ref returns the role name, and the deploy fails.", null, "A plain name string isn't an ARN.", "!Sub needs a template string; on its own it isn't the ARN."]],
 ["!Ref on an SQS queue returns the queue URL; use !GetAtt Queue.Arn for the ARN. Every resource type documents its own Ref return value.", ["The ARN comes from !GetAtt Queue.Arn.", null, "The name comes from !GetAtt Queue.QueueName.", "The account ID is a pseudo parameter."]],
 ["Resources with no references or DependsOn between them don't wait on each other, so CloudFormation creates them in parallel, making deployments faster.", ["Alphabetical order plays no role.", null, "They're created; just not one after another.", "Template order doesn't control creation order."]],
 ["Break the loop by splitting one resource. For example, move the role's inline policy into a separate AWS::IAM::Policy resource so the references no longer go in a circle.", ["DependsOn both ways makes the cycle worse.", null, "Renaming doesn't change the references.", "JSON has the same dependency rules as YAML."]]
],
"mappings-conditions": [
 ["Mappings are static lookup tables: values must be literal strings, numbers or lists. You can't use !Ref or other functions inside them.", ["Functions aren't allowed inside Mappings.", null, "Environment doesn't change the rule.", "!Sub isn't allowed inside Mappings either."]],
 ["!FindInMap takes three items: the map name, the top-level key (often !Ref Env) and the second-level key.", [null, "Two items is one short; you need both levels of keys.", "It needs a list, not a single string.", "That's the shape of !If."]],
 ["!Ref AWS::NoValue removes the property entirely, as if you never wrote it. Typical use: !If [IsProd, value, !Ref AWS::NoValue].", ["An empty string is still a value and may fail validation.", "null isn't a valid CloudFormation value.", null, "DeletionPolicy controls deletion, not properties."]],
 ["A resource whose Condition is false is simply not created; stack events show it as skipped. Outputs that reference it need the same condition.", ["The deploy doesn't fail because of a false condition.", "It isn't created at all, not even empty.", null, "Retain is a DeletionPolicy concept."]]
],
"lifecycle": [
 ["When the very first create fails, the stack rolls back and ends in ROLLBACK_COMPLETE. It can't be updated, so delete it and deploy again.", ["Failed resources are rolled back; the stack isn't stuck in CREATE_FAILED.", null, "UPDATE_COMPLETE means a successful update.", "DELETE_COMPLETE only happens after you delete the stack."]],
 ["aws cloudformation deploy --no-execute-changeset creates the change set so you can review it, without applying anything.", ["CloudFormation has no --dry-run flag.", null, "validate-template only checks syntax.", "--force isn't a CloudFormation deploy option."]],
 ["KeySchema is immutable, so changing it creates a new table and deletes the old one, along with its data unless you set a retain policy.", ["Key schema changes always replace the table.", null, "The change set shows Replacement: True.", "Some interruption applies to properties like instance type."]],
 ["The first CREATE_FAILED event is the real cause. Later failures are usually just \"Resource creation cancelled\" because of the rollback.", ["The last event is usually the rollback finishing.", null, "Resource-level events contain the reason.", "Stack events already show the reason; CloudTrail is extra detail."]]
],
"protect": [
 ["DeletionPolicy: Retain keeps the resource when the stack is deleted or the resource is removed from the template; stack events show DELETE_SKIPPED.", ["DependsOn controls creation order.", null, "Condition controls whether it's created.", "NoEcho masks parameter values."]],
 ["UpdateReplacePolicy: Retain keeps the old physical resource when an update replaces it. Set it together with DeletionPolicy on stateful resources.", [null, "DeletionPolicy only applies to stack or resource deletion, not replacement.", "Termination protection blocks stack deletion, not replacement.", "A stack policy can block updates but doesn't keep the old copy."]],
 ["Snapshot works only for resources that support snapshots, such as RDS instances and clusters, EBS volumes, ElastiCache, Redshift and Neptune.", ["S3 buckets can't be snapshotted; use Retain.", null, "IAM roles have no snapshots.", "Lambda functions have no snapshots."]],
 ["Drift detection marks a manually changed resource MODIFIED (or DELETED if it's gone); unchanged ones are IN_SYNC.", ["IN_SYNC means it matches the template.", null, "Retained isn't a drift status.", "Rollback is a stack status, not drift."]]
],
"vpc-template": [
 ["!Select [0, !GetAZs \"\"] picks the first AZ of whatever Region you deploy to, so the template works anywhere.", ["Hard-coded AZ names break in other Regions.", null, "There's no AZ parameter unless you create one.", "VPCs have no AZ attribute."]],
 ["The internet gateway and its attachment are two separate resources; AWS::EC2::VPCGatewayAttachment connects the IGW to the VPC.", ["Routes point to the IGW but don't attach it.", null, "Subnets don't attach gateways.", "NACLs filter traffic."]],
 ["The route references the IGW but not the attachment, so it could be created before the gateway is attached and fail. DependsOn forces the right order.", ["DependsOn adds waiting; it doesn't speed things up.", null, "Cost isn't affected.", "It's not required syntax, just required for correctness."]],
 ["Each subnet needs an AWS::EC2::SubnetRouteTableAssociation resource linking it to a route table.", [null, "Subnets have no RouteTableId property.", "DependsOn only orders creation.", "Exports share values between stacks."]]
],
"serverless-app": [
 ["API Gateway needs a Lambda::Permission, a resource-based policy on the function allowing apigateway.amazonaws.com to call lambda:InvokeFunction.", ["The role controls what Lambda can do, not who can invoke it.", null, "DynamoDB doesn't invoke the function here.", "CloudWatch Logs receives logs; it doesn't invoke."]],
 ["Scope PutItem to the table's ARN with !GetAtt InvoicesTable.Arn. Least privilege means the exact resource, not every table.", ["\"*\" allows writing to any table in the account.", null, "Wildcard ARNs cover every table in every Region.", "An account ID isn't a resource ARN."]],
 ["AWS::Serverless::* types only exist when you add Transform: AWS::Serverless-2016-10-31; the SAM transform expands them into standard CloudFormation.", [null, "Conditions don't enable resource types.", "The CLI isn't required; the transform runs in CloudFormation.", "Format doesn't matter; the transform does."]],
 ["Pass the generated table name with Environment: Variables: TABLE_NAME: !Ref InvoicesTable, and the code reads os.environ. No hard-coding.", ["Hard-coded names break across environments.", null, "Tags are metadata for people and billing, not app config.", "Outputs return values to people and other stacks, not to the function."]]
],
"multi-stack": [
 ["Nested stack outputs become attributes of the AWS::CloudFormation::Stack resource: !GetAtt NetworkStack.Outputs.VpcId.", ["ImportValue reads exports from independent stacks.", null, "!Ref returns the nested stack's ID.", "FindInMap reads Mappings."]],
 ["StackSets with service-managed permissions deploy one template as stack instances to every account in an OU and Region, including new accounts automatically.", ["Nested stacks deploy within a single account and Region.", null, "Exports share values; they don't deploy anything.", "Change sets preview updates to one stack."]],
 ["Exports that another stack imports can't be changed or deleted, which tightly couples the stacks. SSM Parameter Store is a looser alternative.", ["Speed isn't the issue.", null, "Exports are actually regional only.", "Exports don't cost money."]],
 ["Split stacks by lifecycle and ownership (network, data, app) so changes to one don't risk the others, and permissions can be scoped per stack.", [null, "Fewer files isn't a real benefit.", "YAML isn't the limit (the real limit is 500 resources per stack).", "Parameters are fine to use."]]
],
"iac-security": [
 ["A dynamic reference like '{{resolve:secretsmanager:prod/db:SecretString:password}}' is resolved at deploy time, so the secret never appears in the template or Git.", ["A Default is stored in the template, and in Git.", null, "Base64 is encoding, not encryption.", "Outputs expose values to anyone who can describe the stack."]],
 ["cfn-guard checks templates against policy-as-code rules (e.g. \"buckets must be encrypted\") in CI before anything is deployed. Checkov is a similar option.", [null, "sam local runs functions locally.", "aws configure sets up CLI credentials.", "jq processes JSON."]],
 ["With --role-arn, CloudFormation makes API calls using that service role's permissions, so developers only need CloudFormation access plus iam:PassRole on that role.", ["The point is that humans don't need admin.", null, "IAM is still needed for the role itself.", "Service roles work for any stack."]],
 ["SSH (22) open to 0.0.0.0/0 is a critical finding: constant brute-force attempts. Use SSM Session Manager or restrict the source.", ["Missing tags is a hygiene issue, not high risk.", null, "A missing description is cosmetic.", "PAY_PER_REQUEST is a billing mode, not a risk."]]
],
"tf-cdk": [
 ["terraform plan compares code, state and reality and shows + create, ~ update, -/+ replace and - destroy, just like a change set.", ["init downloads providers and sets up the backend.", null, "fmt formats code.", "state commands inspect or modify state."]],
 ["Teams keep state in a remote backend like S3 with locking and encryption, because state can contain secrets and must not be edited concurrently.", ["State in Git leaks secrets and causes conflicts.", null, "A laptop isn't shared or backed up.", "Outputs are values, not a state store."]],
 ["cdk synth turns your code into a CloudFormation template, and cdk deploy deploys it with CloudFormation, so stacks, rollback and change sets all still apply.", ["CDK is AWS's tool and generates CloudFormation (CDKTF is a separate project).", null, "CDK doesn't call service APIs directly.", "SAM is a different tool."]],
 ["-/+ means Terraform will destroy and recreate the resource, the equivalent of Replacement: True. Watch for it on databases.", ["No change shows nothing at all.", null, "Import is a separate command.", "Reads appear as data sources, not -/+."]]
]
};

/* merge into the lessons (loaded after lessons, before app.js) */
(function (E) { (window.LESSONS || []).forEach(l => { const x = E[l.id]; if (!x || !l.quiz) return; x.forEach((e, i) => { const q = l.quiz[i]; if (!q || !e) return; if (e[0]) q.why = e[0]; if (e[1]) q.w = e[1]; }); }); })(window.EXPLAIN || {});
