import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Draggable } from 'react-beautiful-dnd';
import { Radio, Icon } from 'choerodon-ui';
import { stores } from 'choerodon-front-boot';
import _ from 'lodash';
import ScrumBoardStore from '../../../../../stores/project/scrumBoard/ScrumBoardStore';
import EditStatus from '../EditStatus/EditStatus';
import './StatusCard.scss';

const { AppState } = stores;

@observer
class StatusCard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      complete: false,
      visible: false,
    };
  }
  getStatusNumber() {
    const data = ScrumBoardStore.getBoardData;
    let length = 0;
    _.forEach(data, (item) => {
      length += item.subStatuses.length;
    });
    return length;
  }
  handleDeleteStatus() {
    const originData = JSON.parse(JSON.stringify(ScrumBoardStore.getBoardData));
    const data = JSON.parse(JSON.stringify(ScrumBoardStore.getBoardData));
    const deleteCode = this.props.data.id;
    let deleteIndex = '';
    _.forEach(data[data.length - 1].subStatuses, (item, index) => {
      if (String(item.id) === String(deleteCode)) {
        deleteIndex = index;
      }
    });
    data[data.length - 1].subStatuses.splice(deleteIndex, 1);
    ScrumBoardStore.setBoardData(data);
    ScrumBoardStore.axiosDeleteStatus(deleteCode).then((res) => {
      window.console.log(res);
    }).catch((error) => {
      window.console.log(error);
      ScrumBoardStore.setBoardData(originData);
    });
  }
  renderCloseDisplay() {
    if (this.props.columnId === 'unset') {
      if (this.props.data.issues.length === 0) {
        if (this.getStatusNumber() > 1) {
          return 'block';
        }
      }
    }
    return 'none';
  }
  renderBackground() {
    const data = this.props.data.categoryCode;
    if (data === 'todo') {
      return 'rgb(255, 177, 0)';
    } else if (data === 'doing') {
      return 'rgb(77, 144, 254)';
    } else if (data === 'done') {
      return 'rgb(0, 191, 165)';
    }
    return '#d8d8d8';
  }
  render() {
    this.getStatusNumber();
    return (
      <Draggable 
        key={this.props.data.code}
        draggableId={`${this.props.data.id},${this.props.data.objectVersionNumber}`}
        index={this.props.index}
        type="status"
      >
        {(provided, snapshot) => 
          (
            <div>
              <div 
                ref={provided.innerRef}
                {...provided.draggableProps}
                {...provided.dragHandleProps}
                style={{
                  cursor: 'move',
                  userSelect: 'none',
                  ...provided.draggableProps.style,
                }}
                className="c7n-scrumsetting-card"
              >
                <Icon 
                  style={{ 
                    position: 'absolute', 
                    right: 12,
                    display: this.renderCloseDisplay(),
                    cursor: 'pointer',
                    fontSize: '14px',
                  }} 
                  role="none"
                  onClick={this.handleDeleteStatus.bind(this)}
                  type="close"
                />
                <Icon
                  style={{ 
                    position: 'absolute', 
                    right: 30,
                    cursor: 'pointer',
                    fontSize: '14px',
                  }} 
                  type="settings"
                  role="none"
                  onClick={() => {
                    if (JSON.stringify(ScrumBoardStore.getStatusCategory) === '{}') {
                      ScrumBoardStore.axiosGetStatusCategory().then((data) => {
                        ScrumBoardStore.setStatusCategory(data);
                        this.setState({
                          visible: true,
                        });
                      }).catch((error) => {
                        window.console.log(error);
                      });
                    } else {
                      this.setState({
                        visible: true,
                      });
                    }
                  }}
                />
                <EditStatus
                  visible={this.state.visible}
                  onChangeVisible={(data) => {
                    this.setState({
                      visible: data,
                    });
                  }}
                  data={this.props.data}
                  refresh={this.props.refresh.bind(this)}
                />
                <span
                  className="c7n-scrumsetting-cardStatus"
                  style={{
                    background: this.props.data.categoryCode ? this.renderBackground() : '',
                    color: 'white',
                  }}
                >
                  {this.props.data.status ? this.props.data.status : this.props.data.name}
                </span>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, flexWrap: 'wrap' }}>
                  <p className="textDisplayOneColumn">
                    {this.props.data.issues ? `${this.props.data.issues.length} issues` : ''}
                  </p>
                  <Radio
                    checked={this.props.data.completed ? this.props.data.completed : false}
                    onClick={() => {
                      const data = {
                        id: this.props.data.id,
                        objectVersionNumber: this.props.data.objectVersionNumber,
                        completed: !this.props.data.completed,
                        projectId: AppState.currentMenuType.id,
                      };
                      ScrumBoardStore.axiosUpdateIssueStatus(
                        this.props.data.id, data).then((res) => {
                        this.props.refresh();
                      }).catch((error) => {
                        window.console.log(error);
                      });
                    }}
                  >设置已完成</Radio>
                </div>
              </div>
              {provided.placeholder}
            </div>
          )
        }
      </Draggable>
    );
  }
}

export default StatusCard;

