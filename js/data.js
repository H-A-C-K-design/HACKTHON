// PathGuard — Complete Data Layer
window.PG = window.PG || {};

PG.identities = [
  { id:"john-doe",      name:"John Doe",       email:"john.doe@company.com",      type:"employee",        privilege:"low",      risk:78, groups:7, reachableAssets:14, cloudRoles:2, directPerms:4,  inheritedPerms:23, criticalPaths:3 },
  { id:"alice-smith",   name:"Alice Smith",    email:"alice.smith@company.com",   type:"employee",        privilege:"medium",   risk:61, groups:4, reachableAssets:8,  cloudRoles:1, directPerms:6,  inheritedPerms:14, criticalPaths:1 },
  { id:"bob-chen",      name:"Bob Chen",       email:"bob.chen@company.com",      type:"employee",        privilege:"medium",   risk:55, groups:5, reachableAssets:9,  cloudRoles:1, directPerms:5,  inheritedPerms:17, criticalPaths:1 },
  { id:"contractor-01", name:"Carlos Rivera",  email:"c.rivera@contractor.com",   type:"contractor",      privilege:"low",      risk:91, groups:3, reachableAssets:11, cloudRoles:2, directPerms:3,  inheritedPerms:10, criticalPaths:2 },
  { id:"svc-finance",   name:"svc-finance",    email:"svc-finance@company.com",   type:"service_account", privilege:"high",     risk:92, groups:2, reachableAssets:21, cloudRoles:3, directPerms:12, inheritedPerms:8,  criticalPaths:4 },
  { id:"svc-hr",        name:"svc-hr",         email:"svc-hr@company.com",        type:"service_account", privilege:"medium",   risk:67, groups:2, reachableAssets:9,  cloudRoles:1, directPerms:8,  inheritedPerms:6,  criticalPaths:2 },
  { id:"svc-deploy",    name:"svc-deploy",     email:"svc-deploy@company.com",    type:"service_account", privilege:"high",     risk:84, groups:1, reachableAssets:16, cloudRoles:4, directPerms:15, inheritedPerms:4,  criticalPaths:3 },
  { id:"cloud-admin",   name:"Cloud Admin",    email:"cloud.admin@company.com",   type:"cloud_identity",  privilege:"critical", risk:99, groups:5, reachableAssets:35, cloudRoles:8, directPerms:28, inheritedPerms:42, criticalPaths:9 },
  { id:"dev-user-01",   name:"Dev User 01",    email:"dev01@company.com",         type:"employee",        privilege:"low",      risk:54, groups:3, reachableAssets:6,  cloudRoles:1, directPerms:3,  inheritedPerms:11, criticalPaths:1 },
  { id:"maria-garcia",  name:"Maria Garcia",   email:"maria.garcia@company.com",  type:"employee",        privilege:"medium",   risk:47, groups:4, reachableAssets:5,  cloudRoles:0, directPerms:4,  inheritedPerms:9,  criticalPaths:0 },
  { id:"tom-wilson",    name:"Tom Wilson",     email:"tom.wilson@company.com",    type:"employee",        privilege:"high",     risk:72, groups:6, reachableAssets:12, cloudRoles:3, directPerms:9,  inheritedPerms:19, criticalPaths:2 },
  { id:"svc-backup",    name:"svc-backup",     email:"svc-backup@company.com",    type:"service_account", privilege:"medium",   risk:58, groups:1, reachableAssets:7,  cloudRoles:1, directPerms:6,  inheritedPerms:3,  criticalPaths:1 },
];

PG.groups = [
  { id:"regional-employees",  name:"Regional Employees",   members:240, nestedGroups:3, risk:62, permissions:8,  description:"All regional office employees across EMEA and APAC." },
  { id:"application-support", name:"Application Support",  members:47,  nestedGroups:2, risk:74, permissions:14, description:"Tier-2 support team with access to internal applications." },
  { id:"finance-support",     name:"Finance Support",      members:18,  nestedGroups:1, risk:81, permissions:19, description:"Support staff with elevated access to finance tooling." },
  { id:"service-operations",  name:"Service Operations",   members:32,  nestedGroups:2, risk:68, permissions:11, description:"Operations team managing service accounts and automation." },
  { id:"hr-staff",            name:"HR Staff",             members:25,  nestedGroups:1, risk:59, permissions:9,  description:"Human resources personnel with HR portal access." },
  { id:"cloud-ops",           name:"Cloud Operations",     members:14,  nestedGroups:0, risk:88, permissions:22, description:"Cloud infrastructure operators with broad IAM rights." },
  { id:"dev-team",            name:"Development Team",     members:85,  nestedGroups:2, risk:51, permissions:7,  description:"Software engineers across product squads." },
  { id:"contractors",         name:"External Contractors", members:39,  nestedGroups:0, risk:76, permissions:6,  description:"Third-party contractors with limited scoped access." },
  { id:"exec-leadership",     name:"Executive Leadership", members:11,  nestedGroups:0, risk:93, permissions:31, description:"C-suite and VP-level accounts with broad access." },
  { id:"audit-team",          name:"Audit & Compliance",   members:12,  nestedGroups:0, risk:44, permissions:5,  description:"Internal audit team with read-only access." },
];

PG.groupHierarchy = [
  { parent:"application-support", child:"regional-employees", note:"Regional employees inherit application support group rights, exposing internal service accounts." },
  { parent:"application-support", child:"finance-support",    note:"Finance support is a subgroup of application support, inheriting broad finance tooling access." },
  { parent:"application-support", child:"service-operations", note:"Service operations inherits through application support, granting service account management rights." },
  { parent:"cloud-ops",           child:"service-operations", note:"Service operations has cloud-ops membership, granting elevated cloud infrastructure access." },
];

PG.cloudRoles = [
  { id:"finance-cloud-role",  name:"Cloud Automation Role",   provider:"AWS",   risk:89, assignedIdentities:12, delegatedPerms:8,  criticalAssets:5, description:"Automation role for finance data pipeline operations." },
  { id:"hr-cloud-role",       name:"HR Cloud Processor",      provider:"Azure", risk:64, assignedIdentities:8,  delegatedPerms:5,  criticalAssets:2, description:"Azure role for HR data processing and reporting." },
  { id:"deploy-cloud-role",   name:"Deployment Manager",      provider:"AWS",   risk:77, assignedIdentities:6,  delegatedPerms:11, criticalAssets:4, description:"CI/CD deployment pipeline role with write access to production." },
  { id:"cloud-admin-role",    name:"Cloud Administrator",     provider:"GCP",   risk:97, assignedIdentities:4,  delegatedPerms:28, criticalAssets:9, description:"Full cloud administrator with org-wide permissions." },
  { id:"readonly-cloud-role", name:"Cloud Read-Only Auditor", provider:"AWS",   risk:22, assignedIdentities:18, delegatedPerms:2,  criticalAssets:0, description:"Read-only auditor role for compliance reporting." },
  { id:"backup-cloud-role",   name:"Backup Orchestrator",     provider:"Azure", risk:55, assignedIdentities:5,  delegatedPerms:7,  criticalAssets:3, description:"Manages backup jobs and storage access." },
];

PG.assets = [
  { id:"finance-db",     name:"Financial Database",    criticality:"critical", reachableIdentities:14, attackPaths:6,  criticalPaths:3, maxRisk:96, action:"Implement network segmentation and MFA for all service accounts." },
  { id:"payroll-system", name:"Payroll System",        criticality:"critical", reachableIdentities:9,  attackPaths:4,  criticalPaths:2, maxRisk:91, action:"Restrict cloud role delegation and enforce least privilege." },
  { id:"erp-platform",   name:"ERP Platform",          criticality:"high",     reachableIdentities:22, attackPaths:9,  criticalPaths:1, maxRisk:78, action:"Audit all nested group memberships with ERP access." },
  { id:"hr-portal",      name:"HR Portal",             criticality:"high",     reachableIdentities:18, attackPaths:7,  criticalPaths:1, maxRisk:72, action:"Remove unnecessary delegated access from service accounts." },
  { id:"file-server",    name:"Internal File Server",  criticality:"medium",   reachableIdentities:35, attackPaths:12, criticalPaths:0, maxRisk:58, action:"Review and reduce broad group read access." },
  { id:"finance-app",    name:"Finance Application",   criticality:"high",     reachableIdentities:16, attackPaths:5,  criticalPaths:2, maxRisk:89, action:"Restrict application role assignments to named accounts only." },
  { id:"source-control", name:"Source Code Repo",      criticality:"medium",   reachableIdentities:62, attackPaths:11, criticalPaths:0, maxRisk:47, action:"Enable branch protection and require code reviews." },
  { id:"secrets-vault",  name:"Secrets Vault",         criticality:"critical", reachableIdentities:7,  attackPaths:3,  criticalPaths:1, maxRisk:88, action:"Audit vault access policies and enable break-glass alerting." },
];

PG.relationships = [
  { id:"r01", source:"john-doe",           target:"regional-employees",  type:"MEMBER_OF",    risk:20 },
  { id:"r02", source:"regional-employees", target:"application-support", type:"MEMBER_OF",    risk:35 },
  { id:"r03", source:"application-support",target:"svc-finance",         type:"CAN_ACCESS",   risk:65 },
  { id:"r04", source:"svc-finance",        target:"finance-cloud-role",  type:"CAN_DELEGATE", risk:85 },
  { id:"r05", source:"finance-cloud-role", target:"finance-app",         type:"CAN_ACCESS",   risk:88 },
  { id:"r06", source:"finance-app",        target:"finance-db",          type:"CAN_ACCESS",   risk:96 },
  { id:"r07", source:"contractor-01",      target:"contractors",         type:"MEMBER_OF",    risk:30 },
  { id:"r08", source:"contractors",        target:"finance-cloud-role",  type:"CAN_ACCESS",   risk:70 },
  { id:"r09", source:"finance-cloud-role", target:"payroll-system",      type:"CAN_ACCESS",   risk:91 },
  { id:"r10", source:"alice-smith",        target:"hr-staff",            type:"MEMBER_OF",    risk:25 },
  { id:"r11", source:"hr-staff",           target:"svc-hr",              type:"CAN_ACCESS",   risk:55 },
  { id:"r12", source:"svc-hr",             target:"hr-portal",           type:"CAN_ACCESS",   risk:72 },
  { id:"r13", source:"dev-user-01",        target:"dev-team",            type:"MEMBER_OF",    risk:15 },
  { id:"r14", source:"dev-team",           target:"application-support", type:"MEMBER_OF",    risk:45 },
  { id:"r15", source:"application-support",target:"erp-platform",        type:"CAN_ACCESS",   risk:54 },
  { id:"r16", source:"cloud-admin",        target:"cloud-admin-role",    type:"ASSIGNED_TO",  risk:99 },
  { id:"r17", source:"cloud-admin-role",   target:"finance-db",          type:"CAN_ACCESS",   risk:99 },
  { id:"r18", source:"cloud-admin-role",   target:"payroll-system",      type:"CAN_ACCESS",   risk:99 },
  { id:"r19", source:"cloud-admin-role",   target:"secrets-vault",       type:"CAN_ACCESS",   risk:99 },
  { id:"r20", source:"svc-deploy",         target:"deploy-cloud-role",   type:"CAN_DELEGATE", risk:77 },
  { id:"r21", source:"deploy-cloud-role",  target:"secrets-vault",       type:"CAN_ACCESS",   risk:84 },
  { id:"r22", source:"john-doe",           target:"dev-team",            type:"MEMBER_OF",    risk:15 },
  { id:"r23", source:"john-doe",           target:"application-support", type:"INHERITS",     risk:50 },
  { id:"r24", source:"tom-wilson",         target:"cloud-ops",           type:"MEMBER_OF",    risk:55 },
  { id:"r25", source:"cloud-ops",          target:"finance-cloud-role",  type:"CAN_ACCESS",   risk:82 },
];

PG.attackPaths = [
  { id:"AP-001", severity:"critical", sourceId:"john-doe",     sourceName:"John Doe",     targetId:"finance-db",    targetName:"Financial Database", hops:6, risk:96, status:"open",   initialPrivilege:"Low",
    description:"Low-privileged employee account reaches the Financial Database in 6 hops via nested group membership, service account delegation, and cloud role escalation.",
    steps:[
      { node:"john-doe",           label:"John Doe",              type:"employee",        relationship:null,           relType:null,          risk:20, explanation:"Starting identity. Low-privilege employee with no direct finance access." },
      { node:"regional-employees", label:"Regional Employees",    type:"group",           relationship:"MEMBER_OF",    relType:"membership",  risk:35, explanation:"John Doe is a member of Regional Employees group — nested inside Application Support, granting inherited permissions." },
      { node:"application-support",label:"Application Support",   type:"group",           relationship:"MEMBER_OF",    relType:"inheritance", risk:55, explanation:"Through nested group membership, John Doe inherits all Application Support permissions, including service account access." },
      { node:"svc-finance",        label:"Finance Service Acct",  type:"service_account", relationship:"CAN_ACCESS",   relType:"access",      risk:75, explanation:"Application Support members can access the Finance Service Account — originally configured for a specific integration and never scoped down." },
      { node:"finance-cloud-role", label:"Cloud Automation Role", type:"cloud_role",      relationship:"CAN_DELEGATE", relType:"delegation",  risk:88, explanation:"The Finance Service Account can delegate to the Cloud Automation Role, which holds broad cloud permissions." },
      { node:"finance-app",        label:"Finance Application",   type:"application",     relationship:"CAN_ACCESS",   relType:"access",      risk:91, explanation:"The Cloud Automation Role grants access to the Finance Application and its backend data connections." },
      { node:"finance-db",         label:"Financial Database",    type:"asset",           relationship:"CAN_ACCESS",   relType:"access",      risk:96, explanation:"The Finance Application connects directly to the Financial Database — full read/write access is now reachable." },
    ]
  },
  { id:"AP-002", severity:"critical", sourceId:"contractor-01", sourceName:"Carlos Rivera", targetId:"payroll-system", targetName:"Payroll System", hops:4, risk:91, status:"open", initialPrivilege:"Low",
    description:"External contractor reaches Payroll System via cloud role access that was never revoked after project completion.",
    steps:[
      { node:"contractor-01",      label:"Carlos Rivera",         type:"contractor",   relationship:null,          relType:null,         risk:30, explanation:"External contractor with low declared privilege." },
      { node:"contractors",        label:"External Contractors",  type:"group",        relationship:"MEMBER_OF",   relType:"membership", risk:45, explanation:"Contractor group was granted cloud role access for a time-limited project 6 months ago — access was never revoked." },
      { node:"finance-cloud-role", label:"Cloud Automation Role", type:"cloud_role",   relationship:"CAN_ACCESS",  relType:"access",     risk:78, explanation:"The cloud role was never revoked. Contractors can still access it." },
      { node:"payroll-system",     label:"Payroll System",        type:"asset",        relationship:"CAN_ACCESS",  relType:"access",     risk:91, explanation:"Cloud Automation Role has delegated access to payroll APIs. Sensitive payroll data is directly reachable." },
    ]
  },
  { id:"AP-003", severity:"high",     sourceId:"alice-smith",   sourceName:"Alice Smith",   targetId:"hr-portal",      targetName:"HR Portal",      hops:3, risk:78, status:"open",   initialPrivilege:"Medium",
    description:"Employee with medium privilege reaches HR Portal through misconfigured service account delegation.",
    steps:[
      { node:"alice-smith", label:"Alice Smith", type:"employee",        relationship:null,         relType:null,         risk:25, explanation:"Employee with medium privilege. Direct HR access should be read-only." },
      { node:"hr-staff",    label:"HR Staff",    type:"group",           relationship:"MEMBER_OF",  relType:"membership", risk:45, explanation:"HR Staff group was misconfigured to allow service account access to all members." },
      { node:"svc-hr",      label:"svc-hr",      type:"service_account", relationship:"CAN_ACCESS", relType:"access",     risk:62, explanation:"HR Staff group members can reach the HR service account due to an overly permissive group policy." },
      { node:"hr-portal",   label:"HR Portal",   type:"asset",           relationship:"CAN_ACCESS", relType:"access",     risk:78, explanation:"The HR service account has write access to the HR Portal, including sensitive employee records." },
    ]
  },
  { id:"AP-004", severity:"medium",   sourceId:"dev-user-01",   sourceName:"Dev User 01",   targetId:"erp-platform",   targetName:"ERP Platform",   hops:3, risk:54, status:"review", initialPrivilege:"Low",
    description:"Developer account reaches ERP Platform through nested group inheritance from a legacy configuration.",
    steps:[
      { node:"dev-user-01",        label:"Dev User 01",         type:"employee", relationship:null,         relType:null,          risk:15, explanation:"Developer with low privilege — should be restricted to development environments only." },
      { node:"dev-team",           label:"Development Team",    type:"group",    relationship:"MEMBER_OF",  relType:"membership",  risk:30, explanation:"Dev team is nested inside Application Support via a legacy group configuration." },
      { node:"application-support",label:"Application Support", type:"group",    relationship:"MEMBER_OF",  relType:"inheritance", risk:44, explanation:"Inherited Application Support permissions include ERP access that was never scoped to dev environments." },
      { node:"erp-platform",       label:"ERP Platform",        type:"asset",    relationship:"CAN_ACCESS", relType:"access",      risk:54, explanation:"Application Support has read/write ERP access. Developers should not inherit this." },
    ]
  },
  { id:"AP-005", severity:"critical", sourceId:"svc-deploy",    sourceName:"svc-deploy",    targetId:"secrets-vault",  targetName:"Secrets Vault",  hops:3, risk:88, status:"open",   initialPrivilege:"High",
    description:"Deployment service account reaches Secrets Vault through cloud role delegation, bypassing vault access controls.",
    steps:[
      { node:"svc-deploy",        label:"svc-deploy",         type:"service_account", relationship:null,           relType:null,        risk:55, explanation:"High-privilege deployment service account. Compromise grants CI/CD pipeline and infrastructure access." },
      { node:"deploy-cloud-role", label:"Deployment Manager", type:"cloud_role",      relationship:"CAN_DELEGATE", relType:"delegation",risk:72, explanation:"svc-deploy can delegate to the Deployment Manager cloud role with broad infrastructure rights." },
      { node:"secrets-vault",     label:"Secrets Vault",      type:"asset",           relationship:"CAN_ACCESS",   relType:"access",    risk:88, explanation:"Deployment Manager role reads deployment credentials from the Secrets Vault — bypassing normal vault access controls." },
    ]
  },
];

PG.remediations = [
  { id:"REM-001", severity:"critical", title:"Remove unnecessary delegated permission from Finance Service Account",  description:"The Finance Service Account (svc-finance) has delegation rights to Cloud Automation Role that are no longer required for its primary function.", affectedPaths:["AP-001"], pathsBroken:7, currentRisk:96, projectedRisk:42, reduction:56, effort:"low",    beforePath:["John Doe","Application Support","Finance Service Acct","Finance DB"],         afterPath:["John Doe","Application Support","✗ Finance Service Acct","Finance DB"],         breakPoint:2 },
  { id:"REM-002", severity:"critical", title:"Revoke cloud role access from External Contractors group",              description:"The External Contractors group retains access to Cloud Automation Role from a project that ended 6 months ago. Access was never revoked.",           affectedPaths:["AP-002"], pathsBroken:4, currentRisk:91, projectedRisk:18, reduction:80, effort:"low",    beforePath:["Carlos Rivera","External Contractors","Cloud Automation Role","Payroll System"],afterPath:["Carlos Rivera","✗ External Contractors","Cloud Automation Role","Payroll System"],breakPoint:1 },
  { id:"REM-003", severity:"high",     title:"Remove Dev Team nested membership from Application Support",            description:"Development Team is nested inside Application Support via a legacy configuration, granting ERP and finance access to all developers.",               affectedPaths:["AP-004"], pathsBroken:3, currentRisk:54, projectedRisk:12, reduction:78, effort:"medium", beforePath:["Dev User 01","Development Team","Application Support","ERP Platform"],          afterPath:["Dev User 01","Development Team","✗ Application Support","ERP Platform"],          breakPoint:2 },
  { id:"REM-004", severity:"high",     title:"Scope svc-hr service account to read-only HR Portal access",           description:"The HR service account has write access to the HR Portal. Reducing to read-only eliminates the high-severity escalation path.",                   affectedPaths:["AP-003"], pathsBroken:2, currentRisk:78, projectedRisk:31, reduction:60, effort:"low",    beforePath:["Alice Smith","HR Staff","svc-hr","HR Portal"],                                  afterPath:["Alice Smith","HR Staff","svc-hr (read-only)","HR Portal"],                        breakPoint:-1 },
  { id:"REM-005", severity:"critical", title:"Restrict Deployment Manager role access to Secrets Vault",             description:"svc-deploy should not have access to Secrets Vault via the Deployment Manager role. Use dedicated vault service accounts instead.",               affectedPaths:["AP-005"], pathsBroken:2, currentRisk:88, projectedRisk:25, reduction:72, effort:"medium", beforePath:["svc-deploy","Deployment Manager","Secrets Vault"],                              afterPath:["svc-deploy","Deployment Manager","✗ Secrets Vault"],                              breakPoint:2 },
];

PG.kpis = { totalIdentities:2481, attackPaths:37, criticalPaths:12, highRiskIdentities:38, totalGroups:120, serviceAccounts:35, cloudRoles:42, applications:60, criticalAssets:15, relationships:2541, privilegeEscalationOps:57, remediations:24 };
PG.trends = { totalIdentities:[2310,2380,2401,2444,2481], attackPaths:[29,33,35,36,37], criticalPaths:[9,10,11,12,12], highRiskIdentities:[31,34,36,37,38] };
PG.riskDistribution = { critical:12, high:26, medium:47, low:83 };
PG.riskTrend = [
  { week:"W1", critical:15, high:29, medium:51, low:79 },
  { week:"W2", critical:14, high:28, medium:50, low:80 },
  { week:"W3", critical:13, high:27, medium:48, low:81 },
  { week:"W4", critical:12, high:26, medium:47, low:83 },
];
