# IaC Cheat Sheet

_Auto-generated from the IaC Explorer lessons. One master memory hook + the key commands per lesson._

## 01 · What is Infrastructure as Code?

> ★ "If it's not in code, it doesn't exist." Click once to learn, code it to keep it.

| Command | What it does |
|---|---|
| `declarative` | describe end state |
| `idempotent` | safe to re-run |
| `drift` | reality ≠ template |
| `CFN · SAM · CDK · Terraform` | tools |
| `aws cloudformation deploy` | deploy a template |

**Memory hooks:**

- **ClickOps vs code**: Learn by clicking, ship by coding.
- **Declarative**: Declare the destination; the tool drives.
- **Idempotent**: Same input, same infrastructure.
- **The tools**: CFN = AWS native. TF = multi-cloud. CDK = code → CFN.
- **Drift & guardrails**: Change the code, not the console.

## 02 · Your First Template

> ★ Logical ID → Type → Properties. "Name it, say what it is, configure it."

| Command | What it does |
|---|---|
| `AWSTemplateFormatVersion: "2010-09-09"` | version |
| `Resources: → LogicalId: → Type: / Properties:` | structure |
| `aws cloudformation deploy --template-file t.yaml --stack-name s` | deploy |
| `describe-stack-events` | see events |
| `Outputs: X: Value: !GetAtt R.Arn` | output |

**Memory hooks:**

- **Template anatomy**: "Very Dear Parents Make Cake, Really Often": Version, Description, Parameters, Mappings, Conditions, Resources, Outputs.
- **Logical ID & Type**: Logical = your label. Physical = AWS's real name.
- **Properties**: PascalCase, straight from the docs.
- **Deploy & watch events**: Events tell the story, top to bottom.
- **Outputs**: Need it later? Output it.

## 03 · YAML Survival Guide

> ★ "Colon space, two spaces in, dash for lists."

| Command | What it does |
|---|---|
| `key: value` | map (space after colon) |
| `- item` | list |
| `[a, b]` | flow list |
| `\|` | multi-line text |
| `!Ref · !GetAtt · !Sub` | short tags |
| `cfn-lint template.yaml` | lint before deploy |

**Memory hooks:**

- **Maps: key: value**: Colon, space. Two spaces deeper for children.
- **Lists: dash space**: Dash = new item. Align the rest of the item under the first key.
- **Scalars & quotes**: Weird characters? Quote it. Multi-line? Use |.
- **Short tags**: !Ref = point at it. !GetAtt = ask it for a detail. !Sub = fill in blanks.
- **Debug YAML errors**: Line number first, then indentation.

## 04 · Parameters & Outputs

> ★ Parameters in, Outputs out. A template is a function: inputs → infrastructure → return values.

| Command | What it does |
|---|---|
| `Parameters: X: Type: String` | declare input |
| `AllowedValues: [dev, prod]` | validate |
| `!Sub "app-${Env}-${AWS::Region}"` | build strings |
| `Export: Name: …` | publish value |
| `!ImportValue name` | use another stack’s export |
| `--parameter-overrides Env=prod` | CLI input |

**Memory hooks:**

- **Declare a parameter**: Type is mandatory; Default is optional.
- **Constrain inputs**: Fail fast at the form, not halfway through the build.
- **Use it: !Ref & !Sub**: !Ref for the value, !Sub to weave it into text.
- **Outputs**: If a script or a human will need it, output it.
- **Export & ImportValue**: Export = publish. ImportValue = subscribe. In use = locked.

## 05 · Intrinsic Functions & Dependencies

> ★ Every !Ref is an arrow. Arrows decide the build order.

| Command | What it does |
|---|---|
| `!Ref X` | default ID (name/URL/ARN…) |
| `!GetAtt X.Arn` | specific attribute |
| `!Sub "${X.Arn}/*"` | string with refs |
| `!Select [0, !GetAZs ""]` | first AZ |
| `DependsOn: X` | explicit order |
| `Circular dependency` | split a resource |

**Memory hooks:**

- **!Ref**: !Ref gives "the usual ID". Not always the ARN!
- **!GetAtt**: Need an ARN? Reach for !GetAtt X.Arn.
- **!Sub, !Join, !Select, !Split**: Prefer !Sub over !Join; it reads like the result.
- **Implicit dependencies**: References = arrows. No arrows = parallel. Loop = fail.
- **DependsOn**: No reference but order matters → DependsOn.

## 06 · Mappings & Conditions

> ★ Mappings = lookup. Conditions = switch.

| Command | What it does |
|---|---|
| `Mappings: M: key: { k: v }` | lookup table |
| `!FindInMap [M, !Ref Env, k]` | read it |
| `IsProd: !Equals [!Ref Env, prod]` | condition |
| `Condition: IsProd` | conditional resource |
| `!If [IsProd, a, b]` | choose value |
| `!Ref AWS::NoValue` | omit property |

**Memory hooks:**

- **Mappings**: Map → row → column.
- **!FindInMap**: [Map, Row, Column]: three items, always.
- **Conditions**: !Equals decides, !Not/!And/!Or combine.
- **Conditional resources**: Condition at the resource level = exists or not.
- **!If & AWS::NoValue**: !If [cond, yes, no]. NoValue = erase it.

## 07 · Stack Lifecycle: Change Sets & Rollback

> ★ "Preview, then deploy." A change set is a dry-run receipt.

| Command | What it does |
|---|---|
| `describe-stack-events` | read the story |
| `--no-execute-changeset` | preview only |
| `describe-change-set` | review diff |
| `Replacement: True` | new resource, old deleted |
| `ROLLBACK_COMPLETE` | delete & recreate |
| `continue-update-rollback` | unstick UPDATE_ROLLBACK_FAILED |

**Memory hooks:**

- **Stack states**: ROLLBACK_COMPLETE after create = delete and retry.
- **Change sets**: Create → review → execute.
- **Replacement**: See "Replacement: True"? Stop and think about the data.
- **Rollback**: Find the FIRST failure. The rest is noise.
- **Debug like a pro**: Required · Name · Exists · Permissions · ARN.

## 08 · Protect Your Data: DeletionPolicy, Drift, Stack Policy

> ★ "Retain what you can't recreate."

| Command | What it does |
|---|---|
| `DeletionPolicy: Retain` | keep on delete |
| `UpdateReplacePolicy: Retain` | keep old on replace |
| `DeletionPolicy: Snapshot` | backup then delete |
| `update-termination-protection --enable…` | lock stack |
| `set-stack-policy` | block risky updates |
| `detect-stack-drift` | find manual changes |

**Memory hooks:**

- **Default: Delete**: No policy = demolition includes the furniture.
- **DeletionPolicy: Retain**: Retain on delete AND on replace: write both.
- **Snapshot & RetainExceptOnCreate**: Delete · Retain · Snapshot · RetainExceptOnCreate.
- **Termination protection & stack policy**: Protection for the stack, policy for its parts, IAM for the people.
- **Drift detection**: Detect, then decide: adopt the change in code, or overwrite it.

## 09 · Build a VPC in CloudFormation

> ★ "VPC, Subnets, Gateway, Attach, Table, Route, Associate": Very Smart Geeks Always Test Routes Again.

| Command | What it does |
|---|---|
| `AWS::EC2::VPC CidrBlock` | network |
| `!Select [0, !GetAZs ""]` | portable AZ |
| `InternetGateway + VPCGatewayAttachment` | internet door |
| `Route DependsOn: GatewayAttachment` | ordering fix |
| `SubnetRouteTableAssociation` | one per subnet |
| `Export VpcId` | share with app stacks |

**Memory hooks:**

- **The VPC**: !Ref VPC → vpc-id. Everyone needs it.
- **Subnets in two AZs**: Two AZs minimum. !Select them, don't type them.
- **Gateway + attachment**: Gateway + Attachment: buy it AND install it.
- **Route table, route, associations**: Route → DependsOn → Attachment. Every time.
- **Security group & exports**: Network stack exports, app stacks import.

## 10 · A Serverless App Template (+ SAM)

> ★ "Table, Role, Function, API, Permission, Output": T-R-F-A-P-O: "The Real Function Always Pays Off."

| Command | What it does |
|---|---|
| `BillingMode: PAY_PER_REQUEST` | on-demand table |
| `Resource: !GetAtt Table.Arn` | least privilege |
| `Lambda::Permission Principal apigateway.amazonaws.com` | allow API to invoke |
| `!GetAtt HttpApi.ApiEndpoint` | API URL |
| `Transform: AWS::Serverless-2016-10-31` | SAM |
| `sam build && sam deploy --guided` | SAM workflow |

**Memory hooks:**

- **The table**: Define only the keys. Pay per request.
- **Least-privilege role**: Action specific, Resource !GetAtt. No stars.
- **The function**: Config in env vars, permissions in the role.
- **HTTP API + permission**: Role = what Lambda can do. Permission = who can call Lambda.
- **SAM: the shortcut**: SAM = CloudFormation + macros for serverless.

## 11 · Nested Stacks, Cross-Stack & StackSets

> ★ Cross-stack = neighbors sharing. Nested = parent with children. StackSets = franchise.

| Command | What it does |
|---|---|
| `!ImportValue name` | cross-stack |
| `AWS::CloudFormation::Stack TemplateURL` | nested stack |
| `!GetAtt Child.Outputs.X` | child output |
| `create-stack-set / create-stack-instances` | multi-account |
| `service-managed + OU` | auto-deploy new accounts |
| `AWS::SSM::Parameter::Value<String>` | flexible sharing |

**Memory hooks:**

- **Why split stacks?**: Split by "who changes it and how often".
- **Cross-stack references**: Exports lock. SSM parameters bend.
- **Nested stacks**: Nested = one deploy, many templates. GetAtt Child.Outputs.X.
- **StackSets**: StackSet → instances in every account × region.
- **Modules & registry**: Copy-paste is a bug waiting to diverge.

## 12 · IaC Security: Lint, Scan, Secrets, Pipelines

> ★ "Lint, Guard, Secret, Pipeline": "Let Guards Seal Pipelines."

| Command | What it does |
|---|---|
| `cfn-lint template.yaml` | validate |
| `cfn-guard validate --data t.yaml --rules r.guard` | policy check |
| `checkov -f template.yaml` | security scan |
| `{{resolve:secretsmanager:id:SecretString:key}}` | secret reference |
| `--role-arn …cfn-deployer` | service role |
| `CloudFormation Hooks` | deploy-time enforcement |

**Memory hooks:**

- **Common template misconfigs**: Public · Unencrypted · Wildcard · Open port · Hard-coded secret.
- **cfn-lint**: Lint before you deploy. Every time.
- **Policy as code**: Guard in the PR, Hooks at the door.
- **Secrets: dynamic references**: Reference the secret, never paste it.
- **Pipeline + service role**: Pipeline deploys. Service role acts. Humans approve.

## 13 · Terraform & CDK Compared

> ★ change set = terraform plan = cdk diff. Same idea, three dialects.

| Command | What it does |
|---|---|
| `terraform init / plan / apply` | TF workflow |
| `type.name.attr` | TF reference |
| `backend "s3" { encrypt, use_lockfile }` | remote state |
| `cdk synth / diff / deploy` | CDK workflow |
| `bucket.grantRead(fn)` | CDK least privilege |
| `checkov -d .` | scan CFN + TF + CDK out |

**Memory hooks:**

- **Terraform basics**: type.name.attribute = Terraform's !GetAtt.
- **init · plan · apply**: init → plan → apply. "-/+" means replace!
- **State**: Remote state, locked, encrypted, never in Git.
- **CDK**: CDK writes CloudFormation; grant*() writes IAM.
- **Which one when?**: AWS-only → CFN/CDK. Many clouds → Terraform. Concepts → everywhere.

