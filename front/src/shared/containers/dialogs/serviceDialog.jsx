/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the GPL v2.0+ license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { Component } from "react";
import PropTypes from "prop-types";
import Zrmc, {
  Button,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Dialog,
} from "zrmc";
import { connect } from "react-redux";
import { importSettingsComponent } from "../../../plugins";
import { apiSetMiddlewareRequest } from "../../actions/api";
import PluginsManager from "../../utils/pluginsManager";
/* eslint-enable no-unused-vars */

export class ServiceDialogBase extends Component {
  constructor(props) {
    super(props);
    const { open, instance } = props;
    this.state = { openDialog: open, instance, error: false };
    this.settingsRef = React.createRef();
  }

  componentDidMount() {
    this.updateMiddleware();
    this.loadSettingsComponent();
  }

  static getDerivedStateFromProps(props, state) {
    if (state.openDialog !== props.open) {
      return { openDialog: props.open };
    }
    return null;
  }

  componentDidUpdate(prevProps) {
    if (prevProps.lastMiddleware) {
      const instance = prevProps.lastMiddleware;
      this.setState({ instance });
    }
  }

  loadSettingsComponent() {
    const { service } = this.props;
    const name = service.getName();
    importSettingsComponent(name)
      .then((component) => {
        this.setState({ SettingsComponent: component.default });
      })
      .catch(() => {
        // eslint-disable-next-line
        console.error(
          `cant find plugins ${name}/settings.js component`,
        );
        this.setState({ error: true });
      });
  }

  onAction = (action) => {
    const { service } = this.props;
    const { instance } = this.state;
    const title = service.name;
    if (this.settingsRef) {
      this.settingsRef.current.onAction(action);
    }
    if (action === "save" && this.props.onAction) {
      this.props.onAction(title, service, instance);
    }
  };

  handleOpenDialog = () => {
    this.setState({
      openDialog: true,
    });
  };

  handleCloseDialog = () => {
    this.setState({
      openDialog: false,
    });
    if (this.props.onClosed instanceof Function) {
      this.props.onClosed();
    } else {
      setTimeout(() => {
        Zrmc.closeDialog();
      }, 300);
    }
  };

  updateMiddleware() {
    const origin = this.props.selectedBotId;
    const { service } = this.props;
    if (origin && service && this.state.instance === null) {
      const name = service.getName();
      const pluginsManager = PluginsManager();
      const instance = pluginsManager.instanciate(name, origin);
      this.props.apiSetMiddlewareRequest(origin, instance);
    }
  }

  handleSaveSettings = (middleware) => {
    this.props.apiSetMiddlewareRequest(this.props.selectedBotId, middleware);
  };

  render() {
    const { service } = this.props;
    const { instance } = this.state;
    const title = service.getTitle();
    const { SettingsComponent } = this.state;
    const style = { width: "550px" };
    return (
      <Dialog
        open={this.state.openDialog}
        style={style}
        onClose={this.handleCloseDialog}
      >
        <DialogHeader>{title} - settings</DialogHeader>
        <DialogBody>
          {SettingsComponent && (
            <SettingsComponent
              ref={this.settingsRef}
              instance={instance}
              onAction={this.onAction}
              handleSaveSettings={this.handleSaveSettings}
              publicUrl={this.props.publicUrl}
              appId={service.config}
            />
          )}
          {!SettingsComponent &&
            this.state.error && (
              <div>
                This plugin does not have a configuration page available
              </div>
            )}
        </DialogBody>
        <DialogFooter>
          <Button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              this.handleCloseDialog();
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              this.onAction("save", service);
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </Dialog>
    );
  }
}

ServiceDialogBase.defaultProps = {
  open: true,
  instance: null,
  service: null,
  selectedBotId: null,
  lastMiddleware: null,
  publicUrl: null,
  onClosed: null,
  onAction: null,
};

ServiceDialogBase.propTypes = {
  open: PropTypes.bool,
  instance: PropTypes.shape({}),
  service: PropTypes.shape({
    getTitle: PropTypes.func.isRequired,
    renderSettings: PropTypes.func.isRequired,
  }).isRequired,
  selectedBotId: PropTypes.string,
  lastMiddleware: PropTypes.shape({}),
  publicUrl: PropTypes.string,
  onClosed: PropTypes.func,
  onAction: PropTypes.func,
  apiSetMiddlewareRequest: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => {
  const lastMiddleware = state.app ? state.app.lastMiddleware : null;
  const selectedBotId = state.app ? state.app.selectedBotId : null;
  const publicUrl = state.app ? state.app.admin.publicUrl : null;
  return {
    lastMiddleware,
    selectedBotId,
    publicUrl,
  };
};

const mapDispatchToProps = (dispatch) => ({
  apiSetMiddlewareRequest: (botId, middleware) => {
    dispatch(apiSetMiddlewareRequest(botId, middleware));
  },
});

// prettier-ignore
export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ServiceDialogBase);
