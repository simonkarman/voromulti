# Voromulti deployment on AWS

```bash
export AWS_PROFILE=xebia-playground
export VOROMULTI_BASTION_PUBLIC_IP=$(curl -s ifconfig.me)
export VOROMULTI_BASTION_KEY_NAME='...'
export VOROMULTI_ROOT_ZONE_ID="..."
export VOROMULTI_ROOT_ZONE_DOMAIN_NAME="my.example.org"
npx cdk deploy
```

After deployment, you can access the bastion instance using the following:
```bash
export VOROMULTI_BASTION_IP="..." # from CDK output
ssh -i "~/Downloads/$VOROMULTI_BASTION_KEY_NAME.pem" "ec2-user@$VOROMULTI_BASTION_IP"
```
