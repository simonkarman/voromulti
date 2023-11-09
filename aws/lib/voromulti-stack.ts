import {
  aws_certificatemanager as cm,
  aws_ec2 as ec2,
  aws_ecs as ecs,
  aws_elasticloadbalancingv2 as elbv2,
  aws_route53 as route53,
  aws_route53_targets as route53targets,
  CfnOutput,
  Stack,
  StackProps,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

const getEnvVar = (name: string, defaultValue?: string) => {
  const value = process.env[name] as (string | undefined);
  if (value === undefined) {
    if (defaultValue) {
      return defaultValue;
    }
    throw new Error(`Missing environment variable ${name}`);
  }
  return value;
}

export class VoromultiStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const cluster = new ecs.Cluster(this, 'Cluster');
    // this.createBastion(cluster); // not needed for now
    const listener = this.createLoadBalancer(cluster);
    this.createServer(cluster, listener);
    this.createClient(cluster, listener);
  }

  private createBastion(cluster: ecs.Cluster) {
    const bastion = new ec2.Instance(this, 'Bastion', {
      vpc: cluster.vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.SMALL),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      keyName: getEnvVar('VOROMULTI_BASTION_KEY_NAME'),
      vpcSubnets: {subnetType: ec2.SubnetType.PUBLIC},
    });
    const publicIp = getEnvVar('VOROMULTI_BASTION_PUBLIC_IP', '');
    if (publicIp.length > 0) {
      console.warn(`[WARN] adding public ip (${publicIp}) to security group of bastion for ssh (port 22)`);
      bastion.connections.allowFrom(
        ec2.Peer.ipv4(`${publicIp}/32`),
        ec2.Port.tcp(22),
        'Allow ssh from deployment ip',
      );
    } else {
      console.info(`[INFO] not adding a public ip to security group of bastion for ssh (port 22) as VOROMULTI_BASTION_PUBLIC_IP was not provided`);
    }
    new CfnOutput(this, 'BastionIp', { value: bastion.instancePublicIp });
  }

  private createLoadBalancer(cluster: ecs.Cluster) {
    const loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'LoadBalancer', {
      vpc: cluster.vpc,
      vpcSubnets: {subnetType: ec2.SubnetType.PUBLIC},
      internetFacing: true,
    });
    loadBalancer.addRedirect(); // defaults to HTTP -> HTTPS redirect
    const rootZone = route53.HostedZone.fromHostedZoneAttributes(this, 'RootZone', {
      hostedZoneId: getEnvVar('VOROMULTI_ROOT_ZONE_ID'),
      zoneName: getEnvVar('VOROMULTI_ROOT_ZONE_DOMAIN_NAME'),
    });
    const hostedZone = new route53.HostedZone(this, 'Zone', {
      zoneName: `voromulti.${rootZone.zoneName}`,
    });
    new route53.NsRecord(this, 'ZoneNs', {
      zone: rootZone,
      recordName: 'voromulti',
      values: hostedZone.hostedZoneNameServers || [],
    })
    new route53.ARecord(this, 'ARecord', {
      zone: hostedZone,
      target: route53.RecordTarget.fromAlias(new route53targets.LoadBalancerTarget(loadBalancer)),
    });
    const certificate = new cm.Certificate(this, 'Certificate', {
      domainName: hostedZone.zoneName,
      validation: cm.CertificateValidation.fromDns(hostedZone),
    })
    return loadBalancer.addListener('Listener', {
      port: 443,
      protocol: elbv2.ApplicationProtocol.HTTPS,
      certificates: [elbv2.ListenerCertificate.fromCertificateManager(certificate)],
    });
  }

  private createServer(cluster: ecs.Cluster, listener: elbv2.ApplicationListener) {
    const serverTaskDefinition = new ecs.TaskDefinition(this, 'ServerTask', {
      compatibility: ecs.Compatibility.FARGATE,
      cpu: '256',
      memoryMiB: '512',
    });
    serverTaskDefinition.addContainer('Server', {
      image: ecs.ContainerImage.fromAsset('../server'),
      portMappings: [{ containerPort: 8082, protocol: ecs.Protocol.TCP }],
      healthCheck: { command: ['CMD-SHELL', 'curl -f http://localhost:8082/health || exit 1'] },
      logging: ecs.LogDriver.awsLogs({streamPrefix: 'voromulti-server'}),
    });
    const server = new ecs.FargateService(this, 'Server', {
      cluster,
      taskDefinition: serverTaskDefinition,
    });
    listener.addTargets('Server', {
      conditions: [elbv2.ListenerCondition.pathPatterns(['/game'])],
      priority: 1,
      targets: [server.loadBalancerTarget({
        containerName: 'Server',
        containerPort: 8082,
      })],
      protocol: elbv2.ApplicationProtocol.HTTP,
      port: 8082,
      healthCheck: { path: '/health', port: '8082' },
    });
  }

  private createClient(cluster: ecs.Cluster, listener: elbv2.ApplicationListener) {
    const clientTaskDefinition = new ecs.TaskDefinition(this, 'ClientTask', {
      compatibility: ecs.Compatibility.FARGATE,
      cpu: '512',
      memoryMiB: '1024',
    });
    clientTaskDefinition.addContainer('Client', {
      image: ecs.ContainerImage.fromAsset('../client', {
        buildArgs: {
          KRMX_PROTOCOL: 'wss',
          KRMX_SERVER_URL: `voromulti.${getEnvVar('VOROMULTI_ROOT_ZONE_DOMAIN_NAME')}`,
        },
      }),
      portMappings: [{ containerPort: 3000 }],
      logging: ecs.LogDriver.awsLogs({streamPrefix: 'voromulti-client'}),
    });
    const client = new ecs.FargateService(this, 'Client', {
      cluster,
      taskDefinition: clientTaskDefinition,
    });
    listener.addTargets('Client', {
      targets: [client.loadBalancerTarget({
        containerName: 'Client',
        containerPort: 3000,
      })],
      protocol: elbv2.ApplicationProtocol.HTTP,
      port: 3000,
      healthCheck: { path: '/', port: '3000' },
    });
  }
}
