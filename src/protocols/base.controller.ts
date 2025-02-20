import { Router } from 'express';
import GeneralController from './global.controller';

abstract class BaseController implements GeneralController {
  public path: string;
  public router: Router;

  constructor(path: string) {
    this.path = path;
    this.router = Router();

    this.initializeRoutes();
  }

  private initializeRoutes() {

    this.setupRoutes(this.router);

  }

  protected abstract setupRoutes(router: Router): void;
}

export default BaseController;
