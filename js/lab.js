/* CloudFormation Stack Deployer lab: parses YAML/JSON templates, validates them, resolves intrinsic
   functions, orders resources by dependency, and simulates stack events incl. rollback and change sets. */
window.CFN = (function () {
  const ACCT = '111122223333', REGION = 'ap-southeast-1';
  const T = {
    'AWS::S3::Bucket': { req: [], attrs: ['Arn', 'DomainName', 'RegionalDomainName'], ref: (id, p) => p.BucketName || `stack-${id.toLowerCase()}-1a2b3c`, arn: (r) => `arn:aws:s3:::${r}`, replace: ['BucketName'] },
    'AWS::S3::BucketPolicy': { req: ['Bucket', 'PolicyDocument'], attrs: [] },
    'AWS::IAM::Role': { req: ['AssumeRolePolicyDocument'], attrs: ['Arn', 'RoleId'], ref: (id, p) => p.RoleName || `stack-${id}-ABC123`, arn: r => `arn:aws:iam::${ACCT}:role/${r}`, replace: ['RoleName'] },
    'AWS::IAM::Policy': { req: ['PolicyDocument', 'PolicyName'], attrs: [] },
    'AWS::IAM::ManagedPolicy': { req: ['PolicyDocument'], attrs: ['PolicyArn'], ref: (id) => `arn:aws:iam::${ACCT}:policy/stack-${id}` },
    'AWS::Lambda::Function': { req: ['Code', 'Role'], attrs: ['Arn'], ref: (id, p) => p.FunctionName || `stack-${id}-x1y2z3`, arn: r => `arn:aws:lambda:${REGION}:${ACCT}:function:${r}`, replace: ['FunctionName'] },
    'AWS::Lambda::Permission': { req: ['Action', 'FunctionName', 'Principal'], attrs: [] },
    'AWS::DynamoDB::Table': { req: ['KeySchema', 'AttributeDefinitions'], attrs: ['Arn', 'StreamArn'], ref: (id, p) => p.TableName || `stack-${id}-T1`, arn: r => `arn:aws:dynamodb:${REGION}:${ACCT}:table/${r}`, replace: ['TableName', 'KeySchema'] },
    'AWS::SQS::Queue': { req: [], attrs: ['Arn', 'QueueName', 'QueueUrl'], ref: (id, p) => `https://sqs.${REGION}.amazonaws.com/${ACCT}/${p.QueueName || 'stack-' + id}`, arn: (r, p, id) => `arn:aws:sqs:${REGION}:${ACCT}:${p.QueueName || 'stack-' + id}` },
    'AWS::SNS::Topic': { req: [], attrs: ['TopicArn', 'TopicName'], ref: (id, p) => `arn:aws:sns:${REGION}:${ACCT}:${p.TopicName || 'stack-' + id}` },
    'AWS::SNS::Subscription': { req: ['Protocol', 'TopicArn'], attrs: [] },
    'AWS::Logs::LogGroup': { req: [], attrs: ['Arn'], ref: (id, p) => p.LogGroupName || `stack-${id}`, arn: r => `arn:aws:logs:${REGION}:${ACCT}:log-group:${r}:*` },
    'AWS::KMS::Key': { req: [], attrs: ['Arn', 'KeyId'], ref: () => '1234abcd-12ab-34cd-56ef-1234567890ab', arn: r => `arn:aws:kms:${REGION}:${ACCT}:key/${r}` },
    'AWS::SecretsManager::Secret': { req: [], attrs: [], ref: (id, p) => `arn:aws:secretsmanager:${REGION}:${ACCT}:secret:${p.Name || id}-AbCdEf` },
    'AWS::CloudWatch::Alarm': { req: ['ComparisonOperator', 'EvaluationPeriods'], attrs: ['Arn'], ref: (id, p) => p.AlarmName || `stack-${id}`, arn: r => `arn:aws:cloudwatch:${REGION}:${ACCT}:alarm:${r}` },
    'AWS::EC2::VPC': { req: ['CidrBlock'], attrs: ['CidrBlock', 'VpcId', 'DefaultSecurityGroup'], ref: () => 'vpc-0' + rnd(), replace: ['CidrBlock'] },
    'AWS::EC2::Subnet': { req: ['VpcId', 'CidrBlock'], attrs: ['SubnetId', 'AvailabilityZone'], ref: () => 'subnet-0' + rnd(), replace: ['CidrBlock', 'VpcId', 'AvailabilityZone'] },
    'AWS::EC2::InternetGateway': { req: [], attrs: ['InternetGatewayId'], ref: () => 'igw-0' + rnd() },
    'AWS::EC2::VPCGatewayAttachment': { req: ['VpcId'], attrs: [] },
    'AWS::EC2::RouteTable': { req: ['VpcId'], attrs: ['RouteTableId'], ref: () => 'rtb-0' + rnd() },
    'AWS::EC2::Route': { req: ['RouteTableId'], attrs: [] },
    'AWS::EC2::SubnetRouteTableAssociation': { req: ['RouteTableId', 'SubnetId'], attrs: [] },
    'AWS::EC2::SecurityGroup': { req: ['GroupDescription'], attrs: ['GroupId', 'VpcId'], ref: () => 'sg-0' + rnd() },
    'AWS::EC2::NatGateway': { req: ['SubnetId'], attrs: [], ref: () => 'nat-0' + rnd() },
    'AWS::EC2::EIP': { req: [], attrs: ['AllocationId', 'PublicIp'], ref: () => '13.250.1.9' },
    'AWS::EC2::Instance': { req: ['ImageId'], attrs: ['PrivateIp', 'PublicIp', 'AvailabilityZone'], ref: () => 'i-0' + rnd(), replace: ['ImageId', 'SubnetId'] },
    'AWS::ApiGatewayV2::Api': { req: [], attrs: ['ApiEndpoint', 'ApiId'], ref: () => 'a1b2c3d4e5' },
    'AWS::Events::Rule': { req: [], attrs: ['Arn'], ref: (id) => `stack-${id}` },
    'AWS::CloudFormation::Stack': { req: ['TemplateURL'], attrs: [], ref: (id) => `arn:aws:cloudformation:${REGION}:${ACCT}:stack/child-${id}/abc` }
  };
  let seed = 7; function rnd() { seed = (seed * 9301 + 49297) % 233280; return (seed.toString(16) + 'a1b2c3d4e5f6').slice(0, 12); }
  class CErr extends Error {}
  const isObj = v => v && typeof v === 'object' && !Array.isArray(v);

  function parseTemplate(text) {
    const t = String(text).trim(); if (!t) throw new CErr('Template is empty');
    let v; if (t[0] === '{') { try { v = JSON.parse(t); } catch (e) { throw new CErr('JSON error: ' + e.message); } } else v = YAML.parse(t);
    if (!isObj(v)) throw new CErr('Template format error: the template must be a mapping at the top level');
    return v;
  }
  /* collect references for dependency graph */
  function refs(v, out) {
    if (Array.isArray(v)) v.forEach(x => refs(x, out));
    else if (isObj(v)) { for (const k in v) {
      if (k === 'Ref' && typeof v[k] === 'string') out.add(v[k]);
      else if (k === 'Fn::GetAtt') out.add(Array.isArray(v[k]) ? v[k][0] : String(v[k]).split('.')[0]);
      else if (k === 'Fn::Sub') { const s = Array.isArray(v[k]) ? v[k][0] : v[k]; const vars = Array.isArray(v[k]) ? v[k][1] || {} : {}; String(s).replace(/\$\{([^}!]+)\}/g, (m, x) => { const n = x.split('.')[0]; if (!(n in vars)) out.add(n); }); if (Array.isArray(v[k])) refs(v[k][1], out); }
      else refs(v[k], out); } }
  }
  function validate(tpl, params) {
    const known = new Set(Object.keys(tpl));
    const allowed = ['AWSTemplateFormatVersion', 'Description', 'Metadata', 'Parameters', 'Mappings', 'Conditions', 'Transform', 'Resources', 'Outputs', 'Rules'];
    for (const k of known) if (!allowed.includes(k)) throw new CErr(`Template format error: Invalid template property or properties [${k}]`);
    if (!isObj(tpl.Resources) || !Object.keys(tpl.Resources).length) throw new CErr('Template format error: At least one Resources member must be defined.');
    if (tpl.AWSTemplateFormatVersion && String(tpl.AWSTemplateFormatVersion) !== '2010-09-09') throw new CErr(`Template format error: Unsupported AWSTemplateFormatVersion "${tpl.AWSTemplateFormatVersion}" (use "2010-09-09")`);
    const P = {};
    for (const [k, d] of Object.entries(tpl.Parameters || {})) {
      if (!d || !d.Type) throw new CErr(`Template format error: Every Parameters object must contain a Type member. (${k})`);
      let val = params[k] != null ? params[k] : d.Default;
      if (val == null) throw new CErr(`Parameters: [${k}] must have values`);
      if (d.AllowedValues && !d.AllowedValues.map(String).includes(String(val))) throw new CErr(`Parameter '${k}' must be one of AllowedValues: ${d.AllowedValues.join(', ')}`);
      if (d.AllowedPattern && !new RegExp('^' + d.AllowedPattern + '$').test(String(val))) throw new CErr(`Parameter '${k}' must match pattern ${d.AllowedPattern}`);
      if (d.Type === 'Number') val = Number(val);
      P[k] = val;
    }
    for (const [id, r] of Object.entries(tpl.Resources)) {
      if (!/^[A-Za-z0-9]+$/.test(id)) throw new CErr(`Template format error: Resource name ${id} is non alphanumeric.`);
      if (!isObj(r) || !r.Type) throw new CErr(`Template format error: [/Resources/${id}] Every Resources object must contain a Type member.`);
      if (r.Type === 'AWS::Serverless::Function' && tpl.Transform !== 'AWS::Serverless-2016-10-31') throw new CErr(`Template format error: Unrecognized resource types: [AWS::Serverless::Function] (add Transform: AWS::Serverless-2016-10-31)`);
      if (!T[r.Type] && r.Type !== 'AWS::Serverless::Function') throw new CErr(`Template format error: Unrecognized resource types: [${r.Type}]` + (/^AWS::\w+::\w+$/.test(r.Type) ? ' (not supported by this simulator, or misspelled)' : ''));
      if (r.Condition && !(tpl.Conditions || {})[r.Condition]) throw new CErr(`Template format error: Unresolved condition dependency ${r.Condition} in ${id}`);
    }
    const names = new Set(Object.keys(tpl.Resources).concat(Object.keys(tpl.Parameters || {}), ['AWS::Region', 'AWS::AccountId', 'AWS::StackName', 'AWS::StackId', 'AWS::Partition', 'AWS::URLSuffix', 'AWS::NoValue']));
    const missing = new Set();
    for (const r of Object.values(tpl.Resources)) { const s = new Set(); refs(r.Properties, s); arr(r.DependsOn).forEach(x => s.add(x)); s.forEach(x => { if (!names.has(x)) missing.add(x); }); }
    const so = new Set(); refs(tpl.Outputs, so); so.forEach(x => { if (!names.has(x)) missing.add(x); });
    if (missing.size) throw new CErr(`Template format error: Unresolved resource dependencies [${[...missing].join(', ')}] in the Resources block of the template`);
    return P;
  }
  const arr = x => x == null ? [] : Array.isArray(x) ? x : [x];
  function order(tpl) {
    const ids = Object.keys(tpl.Resources); const deps = {};
    ids.forEach(id => { const s = new Set(); refs(tpl.Resources[id].Properties, s); arr(tpl.Resources[id].DependsOn).forEach(x => s.add(x)); deps[id] = [...s].filter(x => ids.includes(x)); });
    const out = [], state = {};
    const visit = (id, path) => { if (state[id] === 2) return; if (state[id] === 1) throw new CErr(`Circular dependency between resources: [${path.concat(id).join(', ')}]`); state[id] = 1; deps[id].forEach(d => visit(d, path.concat(id))); state[id] = 2; out.push(id); };
    ids.forEach(id => visit(id, []));
    return { order: out, deps };
  }
  function deploy(text, params, prev) {
    const events = []; const ev = (id, type, status, reason) => events.push({ id, type, status, reason: reason || '' });
    let tpl;
    try { tpl = parseTemplate(text); } catch (e) { return { ok: false, error: e.message, events }; }
    let P, ord;
    try { P = validate(tpl, params || {}); ord = order(tpl); } catch (e) { return { ok: false, error: e.message, events, tpl }; }
    const stackName = (params && params.StackName) || 'raul-stack';
    const pseudo = { 'AWS::Region': REGION, 'AWS::AccountId': ACCT, 'AWS::StackName': stackName, 'AWS::StackId': `arn:aws:cloudformation:${REGION}:${ACCT}:stack/${stackName}/abc`, 'AWS::Partition': 'aws', 'AWS::URLSuffix': 'amazonaws.com' };
    const conds = {}; const R = {};
    const NOVAL = Symbol('novalue');
    function resolve(v) {
      if (Array.isArray(v)) return v.map(resolve).filter(x => x !== NOVAL);
      if (!isObj(v)) return v;
      const keys = Object.keys(v);
      if (keys.length === 1) { const k = keys[0], a = v[k];
        if (k === 'Ref') { if (a === 'AWS::NoValue') return NOVAL; if (a in pseudo) return pseudo[a]; if (a in P) return P[a]; if (R[a]) return R[a].ref; throw new CErr(`Unresolved Ref ${a}`); }
        if (k === 'Fn::GetAtt') { const [id, at] = Array.isArray(a) ? a : String(a).split('.'); const r = R[id]; if (!r) throw new CErr(`Unresolved GetAtt ${id}`);
          if (!(at in r.attrs)) throw new CErr(`Template error: resource ${id} does not support attribute type ${at} in Fn::GetAtt`); return r.attrs[at]; }
        if (k === 'Fn::Sub') { const [s, vars] = Array.isArray(a) ? a : [a, {}]; const rv = resolve(vars || {});
          return String(s).replace(/\$\{([^}]+)\}/g, (m, x) => { if (x[0] === '!') return '${' + x.slice(1) + '}'; if (x in rv) return rv[x]; if (x in pseudo) return pseudo[x]; if (x in P) return P[x];
            const [id, at] = x.split('.'); if (R[id]) return at ? resolve({ 'Fn::GetAtt': [id, at] }) : R[id].ref; throw new CErr(`Unresolved variable \${${x}} in Fn::Sub`); }); }
        if (k === 'Fn::Join') { const [d, list] = a; return resolve(list).join(d); }
        if (k === 'Fn::Select') { const [i, list] = a; return resolve(list)[+resolve(i)]; }
        if (k === 'Fn::Split') { const [d, s] = a; return String(resolve(s)).split(d); }
        if (k === 'Fn::GetAZs') return [REGION + 'a', REGION + 'b', REGION + 'c'];
        if (k === 'Fn::FindInMap') { const [m, k1, k2] = resolve(a); const mm = (tpl.Mappings || {})[m]; if (!mm || !mm[k1] || !(k2 in mm[k1])) throw new CErr(`Fn::FindInMap: mapping key not found [${m}, ${k1}, ${k2}]`); return mm[k1][k2]; }
        if (k === 'Fn::Equals') { const [x, y] = resolve(a); return String(x) === String(y); }
        if (k === 'Fn::Not') return !resolve(a[0]);
        if (k === 'Fn::And') return resolve(a).every(Boolean);
        if (k === 'Fn::Or') return resolve(a).some(Boolean);
        if (k === 'Condition') return condVal(a);
        if (k === 'Fn::If') { const [c, t, f] = a; return condVal(c) ? resolve(t) : resolve(f); }
        if (k === 'Fn::ImportValue') return `imported:${resolve(a)}`;
        if (k === 'Fn::Base64') return btoa(unescape(encodeURIComponent(String(resolve(a)))));
      }
      const o = {}; for (const k of keys) { const r = resolve(v[k]); if (r !== NOVAL) o[k] = r; } return o;
    }
    function condVal(name) { if (name in conds) return conds[name]; const c = (tpl.Conditions || {})[name]; if (c == null) throw new CErr(`Condition ${name} not defined`); conds[name] = !!resolve(c); return conds[name]; }
    try { Object.keys(tpl.Conditions || {}).forEach(condVal); } catch (e) { return { ok: false, error: e.message, events, tpl }; }
    ev(stackName, 'AWS::CloudFormation::Stack', prev ? 'UPDATE_IN_PROGRESS' : 'CREATE_IN_PROGRESS', 'User Initiated');
    const created = [];
    for (const id of ord.order) {
      const r = tpl.Resources[id];
      if (r.Condition && !condVal(r.Condition)) { ev(id, r.Type, 'SKIPPED', `Condition ${r.Condition} is false`); continue; }
      ev(id, r.Type, 'CREATE_IN_PROGRESS');
      let props;
      try { props = resolve(r.Properties || {}); } catch (e) { ev(id, r.Type, 'CREATE_FAILED', e.message); return rollback(e.message); }
      const def = T[r.Type] || { req: [], attrs: ['Arn'] };
      const miss = def.req.filter(k => props[k] == null || props[k] === '');
      if (miss.length) { const msg = `Properties validation failed for resource ${id} with message: #: required key [${miss[0]}] not found`; ev(id, r.Type, 'CREATE_FAILED', msg); return rollback(msg); }
      if (r.Type === 'AWS::S3::Bucket' && props.BucketName && !/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(props.BucketName)) { const msg = `Bucket name should not contain uppercase characters, spaces or underscores (${props.BucketName})`; ev(id, r.Type, 'CREATE_FAILED', msg); return rollback(msg); }
      const ref = def.ref ? def.ref(id, props) : `${id}-${rnd()}`;
      const attrs = {}; (def.attrs || []).forEach(a => attrs[a] = a === 'Arn' && def.arn ? def.arn(ref, props, id) : a === 'TopicArn' ? ref : a === 'QueueUrl' ? ref : a === 'DomainName' ? `${ref}.s3.amazonaws.com` : a === 'PublicIp' ? '13.250.7.42' : a === 'PrivateIp' ? '10.0.1.25' : a === 'ApiEndpoint' ? `https://${ref}.execute-api.${REGION}.amazonaws.com` : `${a}-${rnd()}`);
      if (def.arn && !attrs.Arn) attrs.Arn = def.arn(ref, props, id);
      R[id] = { Type: r.Type, Properties: props, ref, attrs, DeletionPolicy: r.DeletionPolicy, UpdateReplacePolicy: r.UpdateReplacePolicy };
      created.push(id); ev(id, r.Type, 'CREATE_COMPLETE');
    }
    const outputs = {};
    try { for (const [k, o] of Object.entries(tpl.Outputs || {})) { if (o.Condition && !condVal(o.Condition)) continue; outputs[k] = { value: resolve(o.Value), export: o.Export ? resolve(o.Export.Name) : null, desc: o.Description || '' }; } }
    catch (e) { return rollback(e.message); }
    ev(stackName, 'AWS::CloudFormation::Stack', prev ? 'UPDATE_COMPLETE' : 'CREATE_COMPLETE');
    const changes = prev ? changeSet(prev, R) : null;
    return { ok: true, events, resources: R, outputs, params: P, conds, changes, tpl };
    function rollback(reason) {
      ev(stackName, 'AWS::CloudFormation::Stack', 'ROLLBACK_IN_PROGRESS', 'The following resource(s) failed to create. Rollback requested by user.');
      created.slice().reverse().forEach(id => { const r = R[id]; if (r.DeletionPolicy === 'Retain') ev(id, r.Type, 'DELETE_SKIPPED', 'DeletionPolicy: Retain'); else { ev(id, r.Type, 'DELETE_IN_PROGRESS'); ev(id, r.Type, 'DELETE_COMPLETE'); } });
      ev(stackName, 'AWS::CloudFormation::Stack', 'ROLLBACK_COMPLETE');
      return { ok: false, error: reason, events, resources: R, tpl, rolledBack: true };
    }
  }
  function changeSet(prev, next) {
    const out = [];
    for (const id of Object.keys(next)) { if (!prev[id]) { out.push({ action: 'Add', id, type: next[id].Type }); continue; }
      const a = JSON.stringify(prev[id].Properties), b = JSON.stringify(next[id].Properties);
      if (a !== b) { const def = T[next[id].Type] || {}; const changed = Object.keys(Object.assign({}, prev[id].Properties, next[id].Properties)).filter(k => JSON.stringify(prev[id].Properties[k]) !== JSON.stringify(next[id].Properties[k]));
        const repl = changed.some(k => (def.replace || []).includes(k)); out.push({ action: 'Modify', id, type: next[id].Type, replacement: repl, props: changed }); } }
    for (const id of Object.keys(prev)) if (!next[id]) out.push({ action: 'Remove', id, type: prev[id].Type, retained: prev[id].DeletionPolicy === 'Retain' });
    return out;
  }
  return { deploy, parseTemplate, TYPES: T };
})();

window.LAB = (function () {
  const DEFAULT = `AWSTemplateFormatVersion: "2010-09-09"
Description: Raul's first stack

Resources:
  ReportsBucket:
    Type: AWS::S3::Bucket
    Properties:
      VersioningConfiguration:
        Status: Enabled

Outputs:
  BucketName:
    Value: !Ref ReportsBucket
`;
  const prevStack = {};
  function render(body, l, api) {
    const ch = l.challenge || {}; const esc = api.esc;
    const saved = api.drafts[l.id]; const text = saved != null ? saved : (ch.starter != null ? ch.starter : DEFAULT);
    body.innerHTML = `<div class="lab cfn"><div class="col"><div class="lh">TEMPLATE <span>YAML or JSON · edit me</span></div><textarea id="labText" spellcheck="false">${esc(text)}</textarea></div>
      <div class="col"><div class="lh">DEPLOY</div>
        <label>Parameters (JSON)<input id="cfP" value='${esc(JSON.stringify(ch.params || {}))}'></label>
        <div class="btnrow"><button class="btn" id="runBtn">▶ DEPLOY STACK</button><button class="btn ghost" id="resetBtn">RESET</button></div>
        <div id="labOut" class="labout"><span class="cm">DEPLOY validates the template, resolves !Ref / !GetAtt / !Sub, creates resources in dependency order and shows the stack events. Deploy twice to see a change set.</span></div></div></div>` + api.taskBar(l);
    const ta = body.querySelector('#labText');
    ta.oninput = () => api.drafts[l.id] = ta.value;
    ta.onkeydown = e => { if (e.key === 'Tab') { e.preventDefault(); const p = ta.selectionStart; ta.value = ta.value.slice(0, p) + '  ' + ta.value.slice(ta.selectionEnd); ta.selectionStart = ta.selectionEnd = p + 2; }
      else if (e.key === 'Enter') { const p = ta.selectionStart; const line = ta.value.slice(0, p).split('\n').pop(); let ind = (line.match(/^\s*/) || [''])[0]; if (/:\s*$/.test(line)) ind += '  '; e.preventDefault(); ta.value = ta.value.slice(0, p) + '\n' + ind + ta.value.slice(ta.selectionEnd); ta.selectionStart = ta.selectionEnd = p + 1 + ind.length; api.drafts[l.id] = ta.value; }
      e.stopPropagation(); };
    body.querySelectorAll('input').forEach(i => i.onkeydown = e => e.stopPropagation());
    const out = body.querySelector('#labOut');
    body.querySelector('#runBtn').onclick = () => {
      let params = {}; try { params = JSON.parse(body.querySelector('#cfP').value || '{}'); } catch (e) { out.innerHTML = `<div class="dec err">✕ Parameters JSON error</div>`; return; }
      const r = CFN.deploy(ta.value, params, prevStack[l.id]);
      let h = '';
      if (r.changes && r.changes.length) h += `<div class="lh" style="margin:4px 0">CHANGE SET (vs previous deploy)</div>` + r.changes.map(c => `<div class="tr ${c.action === 'Remove' ? 'no' : c.replacement ? 'no' : 'ok'}">${c.action === 'Add' ? '＋' : c.action === 'Remove' ? '－' : '～'} ${c.action} ${esc(c.id)} (${esc(c.type)})${c.action === 'Modify' ? ` props: ${esc(c.props.join(', '))} · Replacement: <b>${c.replacement ? 'True ⚠' : 'False'}</b>` : ''}${c.retained ? ' · retained (DeletionPolicy)' : ''}</div>`).join('');
      if (!r.events.length) h = `<div class="dec err">✕ ${esc(r.error)}</div><div class="why">Validation failed before anything was created.</div>`;
      else {
        h = `<div class="dec ${r.ok ? 'allow' : 'deny'}">${r.ok ? '✓ ' + (prevStack[l.id] ? 'UPDATE_COMPLETE' : 'CREATE_COMPLETE') : '✕ ' + (r.rolledBack ? 'ROLLBACK_COMPLETE' : 'FAILED')}</div>` + (r.ok ? '' : `<div class="why">${esc(r.error)}</div>`) + h;
        h += `<div class="lh" style="margin:6px 0 2px">STACK EVENTS</div>` + r.events.map(e => `<div class="tr ${/FAILED|ROLLBACK/.test(e.status) ? 'no' : /COMPLETE/.test(e.status) ? 'ok' : 'skip'}">${esc(e.status.padEnd(18))} ${esc(e.id)} <span class="cm">${esc(e.type)}</span>${e.reason ? ` <i>${esc(e.reason)}</i>` : ''}</div>`).join('');
        if (r.ok) { h += `<div class="lh" style="margin:6px 0 2px">RESOURCES</div>` + Object.entries(r.resources).map(([id, x]) => `<div class="tr ok">● ${esc(id)} → <code>${esc(x.ref)}</code></div>`).join('');
          const o = Object.entries(r.outputs); if (o.length) h += `<div class="lh" style="margin:6px 0 2px">OUTPUTS</div>` + o.map(([k, v]) => `<div class="tr ok">${esc(k)} = <code>${esc(typeof v.value === 'object' ? JSON.stringify(v.value) : v.value)}</code>${v.export ? ` (export: ${esc(v.export)})` : ''}</div>`).join(''); }
      }
      if (r.ok) prevStack[l.id] = r.resources;
      let checkMsg = '';
      if (ch.check) { let res; try { res = ch.check(r); } catch (e) { res = 'check error: ' + e.message; }
        if (res === true) { api.solve(l.id); checkMsg = `<div class="dec allow" style="margin-top:6px">✓ Challenge requirements met</div>`; }
        else checkMsg = `<div class="dec imp" style="margin-top:6px">Challenge: ${esc(typeof res === 'string' ? res : 'not met yet')}</div>`; }
      out.innerHTML = h + checkMsg;
    };
    body.querySelector('#resetBtn').onclick = () => { api.drafts[l.id] = null; delete prevStack[l.id]; render(body, l, api); };
  }
  return { render };
})();
