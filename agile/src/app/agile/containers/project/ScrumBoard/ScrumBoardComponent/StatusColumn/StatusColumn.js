import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import _ from 'lodash';
import './StatusColumn.scss';

@inject('AppState')
@observer
class StatusColumn extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }
  showIssueLength() {
    const data = this.props.data.subStatuses;
    let length = 0;
    _.forEach(data, (item) => {
      length += item.issues.length;
    });
    return length;
  }
  render() {
    return (
      <div className="c7n-scrumboard-status">
        {`${this.props.data.name} (${this.showIssueLength()})`}
      </div>
    );
  }
}

export default StatusColumn;

