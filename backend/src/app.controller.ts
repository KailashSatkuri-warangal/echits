import { Controller, Get, Res } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";

@ApiTags("system")
@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: "Root service status and documentation link" })
  getRoot() {
    return {
      service: "eChits Authoritative Financial Core API",
      status: "ONLINE",
      version: "1.0.0",
      documentation: "/api/docs",
      endpoints: "/api",
      timestamp: new Date().toISOString(),
    };
  }

  @Get("health")
  @ApiOperation({ summary: "System health check" })
  getHealth() {
    return { status: "OK", timestamp: new Date().toISOString() };
  }
}

