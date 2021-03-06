/**
 * props:
 * type
 * defaultValue
 * enterOrBlur
 * disabledDate
 * onChange
 */

import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { DatePicker, Input, Button, Select, Icon, Tooltip, Popover, Modal, Table } from 'choerodon-ui';

@inject('AppState')
@observer
class EasyEdit extends Component {
  constructor(props) {
    super(props);
    this.state = {
      edit: false,
      hoverIf: false,
    };
  }
  renderEdit() {
    if (this.props.type === 'input') {
      return (
        <Input
          defaultValue={this.props.defaultValue}
          autoFocus
          onPressEnter={(e) => {
            this.props.enterOrBlur(e.target.value);
            this.setState({
              edit: false,
              hoverIf: false,
            });
          }}
          onBlur={(e) => {
            this.props.enterOrBlur(e.target.value);
            this.setState({
              edit: false,
              hoverIf: false,
            });
          }}
        />
      );
    } else {
      return (
        <DatePicker
          autoFocus
          open={this.state.edit}
          defaultValue={this.props.defaultValue}
          disabledDate={this.props.disabledDate}
          onOpenChange={(status) => {
            if (!status) {
              this.setState({
                edit: false,
                hoverIf: false,
              });
            }
          }}
          onChange={(date, dateString) => {
            this.props.onChange(date, dateString);
            this.setState({
              edit: false,
              hoverIf: false,
            });
          }}
        />
      );
    }
  }
  render() {
    return (
      <div
        className={this.props.className}
        style={{ 
          position: 'relative',
          cursor: 'pointer',
        }}
        role="none"
        onClick={() => {
          this.setState({
            edit: true,
          });
        }}
        onMouseEnter={() => {
          this.setState({
            hoverIf: true,
          });
        }}
        onMouseLeave={() => {
          this.setState({
            hoverIf: false,
          });
        }}
      >
        {
          this.state.edit ? this.renderEdit() : (
            <div>
              {this.props.children}
              <div
                style={{
                  display: this.state.hoverIf ? 'flex' : 'none',
                  width: '100%',
                  position: 'absolute',
                  height: 'calc(100% + 10px)',
                  top: -5,
                  border: '1px solid gainsboro',
                  justifyContent: 'flex-end',
                  borderRadius: 3,
                }}
              >
                <div
                  style={{
                    background: 'gainsboro',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 3px',
                  }}
                >
                  <Icon style={{ fontSize: 15 }} type="mode_edit" />
                </div>
              </div>
            </div>
          )
        }
      </div>
    );
  }
}

export default EasyEdit;

