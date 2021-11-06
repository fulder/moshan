import os
import shutil
import subprocess

from aws_cdk import core
from aws_cdk.aws_apigatewayv2 import HttpApi, CfnAuthorizer, HttpIntegration, \
    HttpIntegrationType, HttpMethod, \
    PayloadFormatVersion, CfnRoute, \
    CorsPreflightOptions, DomainMappingOptions, HttpStage, DomainName
from aws_cdk.aws_certificatemanager import Certificate, ValidationMethod
from aws_cdk.aws_dynamodb import Table, Attribute, AttributeType, BillingMode
from aws_cdk.aws_iam import PolicyStatement, Role, ServicePrincipal, \
    ManagedPolicy
from aws_cdk.aws_lambda import LayerVersion, Runtime, Function, Code
from aws_cdk.aws_lambda_event_sources import SnsEventSource
from aws_cdk.aws_sns import Topic
from aws_cdk.aws_sqs import Queue
from aws_cdk.core import Duration

from .utils import clean_pycache

CURRENT_DIR = os.path.dirname(os.path.realpath(__file__))
LAMBDAS_DIR = os.path.join(CURRENT_DIR, "..", "..", "src", "lambdas")
LAYERS_DIR = os.path.join(CURRENT_DIR, "..", "..", "src", "layers")
BUILD_FOLDER = os.path.join(CURRENT_DIR, "..", "..", "build")


class WatchHistory(core.Stack):
    def __init__(self, app: core.App, id: str, anime_api_url: str,
                 show_api_url: str, movie_api_url: str, domain_name: str,
                 **kwargs) -> None:
        super().__init__(app, id, **kwargs)
        self.anime_api_url = anime_api_url
        self.show_api_url = show_api_url
        self.movie_api_url = movie_api_url
        self.domain_name = domain_name
        self.layers = {}
        self.lambdas = {}
        self._create_topics()
        self._create_tables()
        self._create_lambdas_config()
        self._create_layers()
        self._create_lambdas()
        self._create_gateway()

    def _create_topics(self):
        self.item_updates_topic = Topic(
            self,
            "item_updates",
        )

    def _create_tables(self):
        self.watch_history_table = Table(
            self,
            "watch_history",
            table_name="watch-history-items",
            partition_key=Attribute(name="username", type=AttributeType.STRING),
            sort_key=Attribute(name="item_id", type=AttributeType.STRING),
            billing_mode=BillingMode.PAY_PER_REQUEST,
        )
        self.watch_history_table.add_local_secondary_index(
            sort_key=Attribute(name="client_id", type=AttributeType.STRING),
            index_name="client_id"
        )
        self.watch_history_table.add_local_secondary_index(
            sort_key=Attribute(name="rating", type=AttributeType.NUMBER),
            index_name="rating"
        )
        self.watch_history_table.add_local_secondary_index(
            sort_key=Attribute(name="latest_watch_date",
                               type=AttributeType.STRING),
            index_name="latest_watch_date"
        )
        self.watch_history_table.add_local_secondary_index(
            sort_key=Attribute(name="state", type=AttributeType.STRING),
            index_name="state"
        )
        self.watch_history_table.add_global_secondary_index(
            partition_key=Attribute(name="item_id", type=AttributeType.STRING),
            index_name="item_id"
        )
        self.watch_history_table.add_global_secondary_index(
            partition_key=Attribute(name="username", type=AttributeType.STRING),
            sort_key=Attribute(name="ep_progress", type=AttributeType.NUMBER),
            index_name="ep_progress"
        )
        self.watch_history_table.add_global_secondary_index(
            partition_key=Attribute(name="username", type=AttributeType.STRING),
            sort_key=Attribute(name="special_progress",
                               type=AttributeType.NUMBER),
            index_name="special_progress"
        )
        self.watch_history_table.add_global_secondary_index(
            partition_key=Attribute(name="username", type=AttributeType.STRING),
            sort_key=Attribute(name="api_info", type=AttributeType.STRING),
            index_name="api_info"
        )

        self.episodes_table = Table(
            self,
            "episodes",
            table_name="watch-history-episodes",
            partition_key=Attribute(name="username", type=AttributeType.STRING),
            sort_key=Attribute(name="id", type=AttributeType.STRING),
            billing_mode=BillingMode.PAY_PER_REQUEST,
        )
        self.episodes_table.add_local_secondary_index(
            sort_key=Attribute(name="latest_watch_date",
                               type=AttributeType.STRING),
            index_name="latest_watch_date"
        )
        self.episodes_table.add_global_secondary_index(
            partition_key=Attribute(name="username", type=AttributeType.STRING),
            sort_key=Attribute(name="api_info", type=AttributeType.STRING),
            index_name="api_info"
        )
        self.episodes_table.add_global_secondary_index(
            partition_key=Attribute(name="api_info", type=AttributeType.STRING),
            index_name="all_api_info"
        )

    def _create_lambdas_config(self):
        self.lambdas_config = {
            "api-watch_histories": {
                "layers": ["utils", "databases", "api"],
                "variables": {
                    "DATABASE_NAME": self.watch_history_table.table_name,
                    "EPISODES_DATABASE_NAME": self.episodes_table.table_name,
                    "LOG_LEVEL": "INFO",
                    "ANIME_API_URL": self.anime_api_url,
                    "MOVIE_API_URL": self.movie_api_url,
                    "TMDB_TOKEN": os.getenv("TMDB_TOKEN"),
                },
                "concurrent_executions": 100,
                "policies": [
                    PolicyStatement(
                        actions=["dynamodb:Query"],
                        resources=[
                            self.watch_history_table.table_arn,
                            f"{self.watch_history_table.table_arn}/index/*",
                            self.episodes_table.table_arn,
                            f"{self.episodes_table.table_arn}/index/*",
                        ]
                    ),
                    PolicyStatement(
                        actions=["dynamodb:UpdateItem"],
                        resources=[
                            self.watch_history_table.table_arn,
                            self.episodes_table.table_arn
                        ],
                    ),
                ],
                "timeout": 60
            },
            "api-watch_history": {
                "layers": ["utils", "databases", "api"],
                "variables": {
                    "DATABASE_NAME": self.watch_history_table.table_name,
                    "LOG_LEVEL": "INFO",
                    "ANIME_API_URL": self.anime_api_url,
                    "SHOWS_API_URL": self.show_api_url,
                    "MOVIE_API_URL": self.movie_api_url,
                },
                "concurrent_executions": 10,
                "policies": [
                    PolicyStatement(
                        actions=["dynamodb:Query"],
                        resources=[self.watch_history_table.table_arn]
                    ),
                    PolicyStatement(
                        actions=["dynamodb:Query"],
                        resources=[
                            f"{self.watch_history_table.table_arn}/index/latest_watch_date",
                            f"{self.watch_history_table.table_arn}/index/rating",
                            f"{self.watch_history_table.table_arn}/index/state",
                            f"{self.watch_history_table.table_arn}/index/ep_progress",
                            f"{self.watch_history_table.table_arn}/index/special_progress",
                        ]
                    ),
                    PolicyStatement(
                        actions=["execute-api:Invoke"],
                        resources=[
                            f"arn:aws:execute-api:eu-west-1:{self.account}:*"]
                    ),
                ],
                "timeout": 30
            },
            "api-watch_history_by_collection": {
                "layers": ["utils", "databases", "api"],
                "variables": {
                    "DATABASE_NAME": self.watch_history_table.table_name,
                    "LOG_LEVEL": "INFO",
                    "ANIME_API_URL": self.anime_api_url,
                    "SHOWS_API_URL": self.show_api_url,
                    "MOVIE_API_URL": self.movie_api_url,
                },
                "concurrent_executions": 10,
                "policies": [
                    PolicyStatement(
                        actions=["dynamodb:Query", "dynamodb:UpdateItem"],
                        resources=[self.watch_history_table.table_arn]
                    ),
                    PolicyStatement(
                        actions=["dynamodb:Query"],
                        resources=[
                            f"{self.watch_history_table.table_arn}/index/latest_watch_date",
                            f"{self.watch_history_table.table_arn}/index/rating",
                            f"{self.watch_history_table.table_arn}/index/state",
                            f"{self.watch_history_table.table_arn}/index/ep_progress",
                            f"{self.watch_history_table.table_arn}/index/special_progress",
                        ]
                    ),
                    PolicyStatement(
                        actions=["execute-api:Invoke"],
                        resources=[
                            f"arn:aws:execute-api:eu-west-1:{self.account}:*"]
                    ),
                ],
                "timeout": 30
            },
            "cron-item_updates": {
                "layers": ["utils", "databases", "api"],
                "variables": {
                    "DATABASE_NAME": self.watch_history_table.table_name,
                    "LOG_LEVEL": "INFO",
                    "UPDATES_TOPIC_ARN": self.item_updates_topic.topic_arn,
                },
                "concurrent_executions": 1,
                "policies": [
                    PolicyStatement(
                        actions=["dynamodb:Query"],
                        resources=[
                            f"{self.watch_history_table.table_arn}/index/item_id"],
                    ),
                    PolicyStatement(
                        actions=["sns:Publish"],
                        resources=[self.item_updates_topic.topic_arn],
                    )
                ],
                "timeout": 60,
                "memory": 1024
            },
            "subscribers-item_updates": {
                "layers": ["utils", "databases", "api"],
                "variables": {
                    "DATABASE_NAME": self.watch_history_table.table_name,
                    "LOG_LEVEL": "INFO",
                },
                "concurrent_executions": 100,
                "policies": [
                    PolicyStatement(
                        actions=["dynamodb:Query"],
                        resources=[
                            f"{self.watch_history_table.table_arn}/index/item_id"]
                    ),
                    PolicyStatement(
                        actions=["dynamodb:PutItem"],
                        resources=[self.watch_history_table.table_arn],
                    ),
                    PolicyStatement(
                        actions=["execute-api:Invoke"],
                        resources=[
                            f"arn:aws:execute-api:eu-west-1:{self.account}:*"]
                    ),
                ],
                "timeout": 60
            },
        }

    def _create_layers(self):
        if os.path.isdir(BUILD_FOLDER):
            shutil.rmtree(BUILD_FOLDER)
        os.mkdir(BUILD_FOLDER)

        for layer in os.listdir(LAYERS_DIR):
            layer_folder = os.path.join(LAYERS_DIR, layer)
            build_folder = os.path.join(BUILD_FOLDER, layer)
            shutil.copytree(layer_folder, build_folder)

            requirements_path = os.path.join(build_folder, "requirements.txt")

            if os.path.isfile(requirements_path):
                packages_folder = os.path.join(build_folder, "python", "lib",
                                               "python3.8", "site-packages")
                print(
                    f"Installing layer requirements to target: {os.path.abspath(packages_folder)}")
                subprocess.check_output(
                    ["pip", "install", "-r", requirements_path, "-t",
                     packages_folder])
                clean_pycache()

            self.layers[layer] = LayerVersion(
                self,
                layer,
                layer_version_name=f"watch-history-{layer}",
                code=Code.from_asset(path=build_folder),
                compatible_runtimes=[Runtime.PYTHON_3_8],
            )

    def _create_lambdas(self):
        for root, dirs, files in os.walk(LAMBDAS_DIR):
            for f in files:
                if f != "__init__.py":
                    continue

                if "watch_histories/" in root:
                    continue

                parent_folder = os.path.basename(os.path.dirname(root))
                lambda_folder = os.path.basename(root)
                name = f"{parent_folder}-{lambda_folder}"
                lambda_config = self.lambdas_config[name]

                layers = []
                for layer_name in lambda_config["layers"]:
                    layers.append(self.layers[layer_name])

                lambda_role = Role(
                    self,
                    f"{name}_role",
                    assumed_by=ServicePrincipal(service="lambda.amazonaws.com")
                )
                for policy in lambda_config["policies"]:
                    lambda_role.add_to_policy(policy)
                lambda_role.add_managed_policy(
                    ManagedPolicy.from_aws_managed_policy_name(
                        "service-role/AWSLambdaBasicExecutionRole"))

                self.lambdas[name] = Function(
                    self,
                    name,
                    code=Code.from_asset(root),
                    handler="__init__.handle",
                    runtime=Runtime.PYTHON_3_8,
                    layers=layers,
                    function_name=name,
                    environment=lambda_config["variables"],
                    reserved_concurrent_executions=lambda_config[
                        "concurrent_executions"],
                    role=lambda_role,
                    timeout=Duration.seconds(lambda_config["timeout"]),
                    memory_size=512,
                )

        self.lambdas["subscribers-item_updates"].add_event_source(
            SnsEventSource(
                self.item_updates_topic,
                dead_letter_queue=Queue(self, "item_updates_dlq"),
            )
        )

    def _create_gateway(self):
        cert = Certificate(
            self,
            "certificate",
            domain_name=self.domain_name,
            validation_method=ValidationMethod.DNS
        )
        domain_name = DomainName(
            self,
            "domain",
            domain_name=self.domain_name,
            certificate=cert,
        )

        http_api = HttpApi(
            self,
            "watch-history",
            create_default_stage=False,
            cors_preflight=CorsPreflightOptions(
                allow_methods=[HttpMethod.GET, HttpMethod.POST, HttpMethod.PUT,
                               HttpMethod.DELETE],
                allow_origins=["https://moshan.tv", "https://beta.moshan.tv"],
                allow_headers=["authorization", "content-type"]
            )
        )

        authorizer = CfnAuthorizer(
            self,
            "cognito",
            api_id=http_api.http_api_id,
            authorizer_type="JWT",
            identity_source=["$request.header.Authorization"],
            name="cognito",
            jwt_configuration=CfnAuthorizer.JWTConfigurationProperty(
                audience=["68v5rahd0sdvrmf7fgbq2o1a9u"],
                issuer="https://cognito-idp.eu-west-1.amazonaws.com/eu-west-1_sJ3Y4kSv6"
            )
        )

        routes = {
            "watch_histories": {
                "method": ["GET", "POST", "PUT", "DELETE"],
                "route": "/{proxy+}",
                "target_lambda": self.lambdas["api-watch_histories"]
            },
            "watch_history": {
                "method": ["GET"],
                "route": "/watch-history",
                "target_lambda": self.lambdas["api-watch_history"]
            },
            "watch_history_by_collection": {
                "method": ["GET", "POST"],
                "route": "/watch-history/collection/{collection_name}",
                "target_lambda": self.lambdas["api-watch_history_by_collection"]
            },
        }

        for r in routes:
            for m in routes[r]["method"]:
                integration = HttpIntegration(
                    self,
                    f"{m}_{r}_integration",
                    http_api=http_api,
                    integration_type=HttpIntegrationType.LAMBDA_PROXY,
                    integration_uri=routes[r]["target_lambda"].function_arn,
                    method=getattr(HttpMethod, m),
                    payload_format_version=PayloadFormatVersion.VERSION_2_0,
                )
                CfnRoute(
                    self,
                    f"{m}_{r}",
                    api_id=http_api.http_api_id,
                    route_key=f"{m} {routes[r]['route']}",
                    authorization_type="JWT",
                    authorizer_id=authorizer.ref,
                    target="integrations/" + integration.integration_id
                )

            routes[r]["target_lambda"].add_permission(
                f"{r}_apigateway_invoke",
                principal=ServicePrincipal("apigateway.amazonaws.com"),
                source_arn=f"arn:aws:execute-api:{self.region}:{self.account}:{http_api.http_api_id}/*"
            )

        HttpStage(
            self,
            "prod",
            http_api=http_api,
            auto_deploy=True,
            stage_name="prod",
            domain_mapping=DomainMappingOptions(
                domain_name=domain_name,
            )
        )
