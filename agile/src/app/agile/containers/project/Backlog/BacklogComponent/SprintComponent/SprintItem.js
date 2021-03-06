import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Droppable } from 'react-beautiful-dnd';
import { DatePicker, Input, Button, Select, Icon, Tooltip, Popover, Modal, Table } from 'choerodon-ui';
import { Page, Header, Content, stores } from 'choerodon-front-boot';
import _ from 'lodash';
import moment from 'moment';
import CloseSprint from './CloseSprint';
import BacklogStore from '../../../../../stores/project/backlog/BacklogStore';
import StartSprint from './StartSprint';
import emptyPng from '../../../../../assets/image/emptySprint.png';
import EasyEdit from '../../../../../components/EasyEdit/EasyEdit';

const { Sidebar } = Modal;
const Option = Select.Option;
const confirm = Modal.confirm;
const { AppState } = stores;

@observer
class SprintItem extends Component {
  constructor(props) {
    super(props);
    this.state = {
      editStartDate: false,
      editendDate: false,
      expand: true,
      createIssue: false,
      selectIssueType: 'story',
      createIssueValue: '',
      editName: false,
      editGoal: false,
      closeSprintVisible: false,
      startSprintVisible: false,
      visibleAssign: false,
      loading: false,
      total: {
        totalIssue: '无',
        totalStoryPoints: '无',
        totalTime: '无',
      },
    };
  }
  componentWillReceiveProps(nextProps) {
    const assignData = nextProps.item.assigneeIssues;
    let totalIssue = 0;
    let totalStoryPoints = 0;
    let totalTime = 0;
    _.forEach(assignData, (item) => {
      if (item.issueCount) {
        totalIssue += item.issueCount;
      }
      if (item.totalStoryPoints) {
        totalStoryPoints += item.totalStoryPoints;
      }
      if (item.totalRemainingTime) {
        totalTime += item.totalRemainingTime;
      }
    });
    this.setState({
      total: {
        totalIssue,
        totalStoryPoints,
        totalTime,
      },
    });
  }
  updateDate(type, date2) {
    let date = date2;
    const data = {
      objectVersionNumber: this.props.item.objectVersionNumber,
      projectId: AppState.currentMenuType.id,
      sprintId: this.props.item.sprintId,
      [type]: date += ' 00:00:00',
    };
    BacklogStore.axiosUpdateSprint(data).then((res) => {
      this.props.refresh();
    }).catch((error) => {
      window.console.log(error);
    });
  }
  handleBlurCreateIssue() {
    this.setState({
      loading: true,
    });
    if (this.state.createIssueValue !== '') {
      const data = {
        priorityCode: 'medium',
        projectId: AppState.currentMenuType.id,
        sprintId: this.props.item.sprintId,
        summary: this.state.createIssueValue,
        typeCode: this.state.selectIssueType,
        ...!isNaN(BacklogStore.getChosenEpic) ? {
          epicId: BacklogStore.getChosenEpic,
        } : {},
        ...!isNaN(BacklogStore.getChosenVersion) ? {
          versionIssueRelDTOList: [
            {
              versionId: BacklogStore.getChosenVersion,
            },
          ],
        } : {},
        parentIssueId: 0,
      };
      BacklogStore.axiosEasyCreateIssue(data).then((res) => {
        this.setState({
          // createIssue: false,
          createIssueValue: '',
          loading: false,
        });
        this.props.refresh();
      }).catch((error) => {
        this.setState({
          loading: false,
        });
        window.console.log(error);
      });
    }
  }
  handleBlurName(value) {
    const data = {
      objectVersionNumber: this.props.item.objectVersionNumber,
      projectId: AppState.currentMenuType.id,
      sprintId: this.props.item.sprintId,
      sprintName: value,
    };
    BacklogStore.axiosUpdateSprint(data).then((res) => {
      this.setState({
        editName: false,
      });
      this.props.refresh();
    }).catch((error) => {
      window.console.log(error);
    });
  }
  handleBlurGoal(value) {
    const data = {
      objectVersionNumber: this.props.item.objectVersionNumber,
      projectId: AppState.currentMenuType.id,
      sprintId: this.props.item.sprintId,
      sprintGoal: value,
    };
    BacklogStore.axiosUpdateSprint(data).then((res) => {
      this.setState({
        editGoal: false,
      });
      this.props.refresh();
    }).catch((error) => {
      window.console.log(error);
    });
  }
  renderData(item, type) {
    //   startDate endDate
    let result = '';
    if (!_.isNull(item[type])) {
      result = `${item[type].split('-')[0]}年${item[type].split('-')[1]}月${item[type].split('-')[2].substring(0, 2)}日`;
    } else {
      result = '无';
    }
    return result;
  }
  renderOpenColor(type) {
    if (BacklogStore.getSprintData.sprintData.filter(items => items.statusCode === 'started').length === 0) {
      if (this.props.item.issueSearchDTOList) {
        if (this.props.item.issueSearchDTOList.length > 0) {
          if (type === 'color') {
            return '#3f51b5';
          } else {
            return 'pointer';
          }
        }
      }
    }
    if (type === 'color') {
      return 'rgba(0,0,0,0.26)';
    } else {
      return 'not-allowed';
    }
  }
  renderIssueOrIntro(issues, sprintId) {
    if (issues) {
      if (issues.length > 0) {
        return this.props.renderSprintIssue(issues, sprintId);
      }
    }
    if (this.props.index === 0) {
      return (
        <div style={{ display: 'flex', height: 100 }} className="c7n-noissue-notzero">
          <img style={{ width: 80, height: 70 }} alt="空sprint" src={emptyPng} />
          <div style={{ marginLeft: 20 }}>
            <p>计划您的SPRINT</p>
            <p>这是一个Sprint。将问题拖拽至此来计划一个Sprint。</p>
          </div>
        </div>
      );
    } else {
      return (
        <div className="c7n-noissue-notzero">要计划一次sprint, 可以拖动本次sprint页脚到某个问题的下方，或者把问题拖放到这里</div>
      );
    }
  }
  render() {
    const item = this.props.item;
    const columns = [{
      title: '经办人',
      dataIndex: 'assigneeName',
      key: 'assigneeName',
      render: text => (text === '合计' ? (
        <p >{text}</p>
      ) : (<p>{text || '未分配'}</p>)),
    }, {
      title: '问题',
      dataIndex: 'issueCount',
      key: 'issueCount',
      render: text => (text || '无'),
    }, {
      title: 'Story Points',
      dataIndex: 'totalStoryPoints',
      key: 'totalStoryPoints',
      render: text => (text || '无'),
    }, {
      title: '剩余预估时间',
      dataIndex: 'totalRemainingTime',
      index: 'totalRemainingTime',
      render: text => (text || '无'),
    }];
    return (
      <div>
        <div className="c7n-backlog-sprintTop">
          <div className="c7n-backlog-springTitle">
            <div className="c7n-backlog-sprintTitleSide">
              <p className="c7n-backlog-sprintName">
                <Icon
                  style={{ fontSize: 20, cursor: 'pointer' }}
                  type={this.state.expand ? 'keyboard_arrow_down' : 'keyboard_arrow_right'}
                  role="none"
                  onClick={() => {
                    this.setState({
                      expand: !this.state.expand,
                    });
                  }}
                />
                <EasyEdit
                  type="input"
                  defaultValue={item.sprintName}
                  enterOrBlur={this.handleBlurName.bind(this)}
                >
                  <span
                    style={{ marginLeft: 8, cursor: 'pointer' }}
                    role="none"
                  >{item.sprintName}</span>
                </EasyEdit>
              </p>
              <p className="c7n-backlog-sprintQuestion">{!_.isNull(item.issueSearchDTOList) ? `${item.issueSearchDTOList.length} 问题` : '0 问题'}</p>
            </div>
            <div style={{ flexGrow: 1 }} className="c7n-backlog-sprintTitleSide">
              {item.statusCode === 'started' ? (
                <p className="c7n-backlog-sprintStatus">活跃</p>
              ) : (
                <p className="c7n-backlog-sprintStatus2">未开始</p>
              )}
              {item.statusCode === 'started' ? (
                <p
                  className="c7n-backlog-closeSprint"
                  role="none"
                  onClick={() => {
                    BacklogStore.axiosGetSprintCompleteMessage(
                      this.props.item.sprintId).then((res) => {
                      BacklogStore.setSprintCompleteMessage(res);
                      let flag = 0;
                      if (res.parentsDoneUnfinishedSubtasks) {
                        if (res.parentsDoneUnfinishedSubtasks.length > 0) {
                          flag = 1;
                          let issueNums = '';
                          _.forEach(res.parentsDoneUnfinishedSubtasks, (items) => {
                            issueNums += `${items.issueNum} `;
                          });
                          confirm({
                            title: 'warnning',
                            content: `父卡${issueNums}有未完成的子任务，无法完成冲刺`,
                            onCancel() {
                              window.console.log('Cancel');
                            },
                          });
                        }
                      }
                      if (flag === 0) {
                        this.setState({
                          closeSprintVisible: true,
                        });
                      }
                    }).catch((error) => {
                      window.console.log(error);
                    });
                  }}
                >完成冲刺</p>
              ) : (
                <p
                  className="c7n-backlog-openSprint"
                  style={{
                    color: this.renderOpenColor('color'),
                    cursor: this.renderOpenColor('cursor'),
                  }}
                  role="none"
                  onClick={() => {
                    if (!BacklogStore.getSprintData.sprintData.filter(items => items.statusCode === 'started').length > 0) {
                      if (this.props.item.issueSearchDTOList.length > 0) {
                        BacklogStore.axiosGetOpenSprintDetail(
                          this.props.item.sprintId).then((res) => {
                          BacklogStore.setOpenSprintDetail(res);
                          this.setState({
                            startSprintVisible: true,
                          });
                        }).catch((error) => {
                          window.console.log(error);
                        });
                      }
                    }
                  }}
                >开启冲刺</p>
              )}
              <StartSprint
                visible={this.state.startSprintVisible}
                onCancel={() => {
                  this.setState({
                    startSprintVisible: false,
                  });
                }}
                data={this.props.item}
                refresh={this.props.refresh.bind(this)}
              />
              <CloseSprint
                visible={this.state.closeSprintVisible}
                onCancel={() => {
                  this.setState({
                    closeSprintVisible: false,
                  });
                }}
                data={this.props.item}
                refresh={this.props.refresh.bind(this)}
              />
            </div>
          </div>
          <div
            className="c7n-backlog-sprintDes"
            style={{
              display: this.props.item.assigneeIssues && this.props.item.assigneeIssues.length > 0 ? 'flex' : 'none',
            }}
          >
            {
              this.props.item.assigneeIssues ? (
                this.props.item.assigneeIssues
                  .filter(ass => !_.isNull(ass.assigneeId))
                  .map(ass2 => (
                    <Tooltip 
                      placement="bottom"
                      title={(
                        <div>
                          <p>{ass2.assigneeName}</p>
                          <p>{ass2.totalStoryPoints} story points</p>
                          <p>{ass2.totalRemainingTime ? ass2.totalRemainingTime : '无'} 剩余预估时间</p>
                          <p>{ass2.issueCount} 问题</p>
                        </div>
                      )}
                    >
                      <div className="c7n-backlog-sprintIcon">{ass2.assigneeName ? ass2.assigneeName.substring(0, 1).toUpperCase() : ''}</div>
                    </Tooltip>
                  ))) : ''
            }
            <Icon 
              style={{ 
                cursor: 'pointer',
                fontSize: 20,
                marginLeft: 8,
                display: this.props.item.assigneeIssues && this.props.item.assigneeIssues.length > 0 ? 'block' : 'none',
              }}
              type="more_vert"
              role="none"
              onClick={() => {
                this.setState({
                  visibleAssign: true,
                });
              }}
            />
            <Sidebar
              title="经办人工作量"
              visible={this.state.visibleAssign}
              onOk={() => {
                this.setState({
                  visibleAssign: false,
                });
              }}
              okText="确定"
              cancelText="取消"
              onCancel={() => {
                this.setState({
                  visibleAssign: false,
                });
              }}
            >
              <Content
                style={{
                  padding: 0,
                }}
                title={`"${this.props.item.sprintName}"的经办人工作量`}
                description="您可以在这里查看当前冲刺中问题的分配情况，包括每位成员的问题数量、故事点数总和、剩余预估时间总和等信息。"
              >
                <Table
                  dataSource={_.concat(this.props.item.assigneeIssues, {
                    assigneeName: '合计',
                    issueCount: this.state.total.totalIssue,
                    totalStoryPoints: this.state.total.totalStoryPoints,
                    totalRemainingTime: this.state.total.totalTime,
                  })}
                  columns={columns}
                />
              </Content>
            </Sidebar>
            <div
              className="c7n-backlog-sprintData"
              style={{
                display: item.statusCode === 'started' ? 'flex' : 'none',
              }}
            >
              <EasyEdit
                type="date"
                defaultValue={item.startDate ? moment(item.startDate.split(' ')[0], 'YYYY-MM-DD') : ''}
                disabledDate={item.endDate ? current => current > moment(item.endDate, 'YYYY-MM-DD HH:mm:ss') : ''}
                onChange={(date, dateString) => {
                  this.updateDate('startDate', dateString);
                }}
              >
                <p
                  className="c7n-backlog-sprintDataItem"
                  role="none"
                >{this.renderData(item, 'startDate')}</p>
              </EasyEdit>
              <p>~</p>
              <EasyEdit
                type="date"
                defaultValue={item.endDate ? moment(item.endDate.split(' ')[0], 'YYYY-MM-DD') : ''}
                disabledDate={item.startDate ? current => current < moment(item.startDate, 'YYYY-MM-DD HH:mm:ss') : ''}
                onChange={(date, dateString) => {
                  this.updateDate('endDate', dateString);
                }}
              >
                <p
                  className="c7n-backlog-sprintDataItem"
                  role="none"
                >{this.renderData(item, 'endDate')}</p>
              </EasyEdit>
            </div>
          </div>
          <div
            className="c7n-backlog-sprintGoal"
            style={{
              display: item.statusCode === 'started' ? 'flex' : 'none',
            }} 
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <p>本周冲刺目标：</p>
              {/* {this.state.editGoal ? (
                <div>
                  <Input 
                    autoFocus 
                    defaultValue={item.sprintGoal}
                    onPressEnter={this.handleBlurGoal.bind(this)}
                    onBlur={this.handleBlurGoal.bind(this)}
                  />
                </div>
              ) : (
                <p
                  role="none"
                  style={{
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    this.setState({
                      editGoal: true,
                    });
                  }}
                >{item.sprintGoal ? item.sprintGoal : '无'}</p>
              )} */}
              <EasyEdit
                type="input"
                defaultValue={item.sprintGoal}
                enterOrBlur={this.handleBlurGoal.bind(this)}
              >
                <p
                  role="none"
                  style={{
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    this.setState({
                      editGoal: true,
                    });
                  }}
                >{item.sprintGoal ? item.sprintGoal : '无'}</p>
              </EasyEdit>
            </div>
            <div 
              style={{
                display: 'flex',
              }} 
              className="c7n-backlog-sprintGoalSide"
            >
              <div style={{ backgroundColor: '#4D90FE' }}>{item.todoStoryPoint}</div>
              <div style={{ backgroundColor: '#FFB100' }}>{item.doingStoryPoint}</div>
              <div style={{ backgroundColor: '#00BFA5' }}>{item.doneStoryPoint}</div>
            </div>
          </div>
        </div>
        {this.state.expand ? (
          <Droppable 
            droppableId={item.sprintId}
            isDropDisabled={BacklogStore.getIsLeaveSprint}
          >
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                style={{
                  background: snapshot.isDraggingOver ? 'lightblue' : 'white',
                  // background: 'white',
                  padding: 'grid',
                  borderBottom: '1px solid rgba(0,0,0,0.12)',
                }}
              >
                {this.renderIssueOrIntro(item.issueSearchDTOList, item.sprintId)}
                {provided.placeholder}
                <div className="c7n-backlog-sprintIssue">
                  <div
                    style={{
                      userSelect: 'none',
                      background: 'white',  
                      padding: '10px 0 10px 43px',
                      fontSize: 13,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {this.state.createIssue ? (
                      <div className="c7n-backlog-sprintIssueSide" style={{ display: 'block' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <Select
                            value={this.state.selectIssueType}
                            style={{
                              width: 50,
                              height: 20,
                            }}
                            onChange={(value) => {
                              this.setState({
                                selectIssueType: value,
                              });
                            }}
                            dropdownMatchSelectWidth={false}
                          >
                            <Option value="story">
                              <Tooltip title="故事">
                                <div
                                  className="c7n-backlog-sprintType"
                                  style={{
                                    background: '#00BFA5',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginRight: 0,
                                  }}
                                >
                                  <Icon style={{ color: 'white', fontSize: '14px' }} type="class" />
                                </div>
                              </Tooltip>
                            </Option>
                            <Option value="task">
                              <Tooltip title="任务">
                                <div
                                  className="c7n-backlog-sprintType"
                                  style={{
                                    background: '#4D90FE',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginRight: 0,
                                  }}
                                >
                                  <Icon style={{ color: 'white', fontSize: '14px' }} type="assignment" />
                                </div>
                              </Tooltip>
                            </Option>
                            <Option value="bug">
                              <Tooltip title="缺陷">
                                <div
                                  className="c7n-backlog-sprintType"
                                  style={{
                                    background: '#F44336',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginRight: 0,
                                  }}
                                >
                                  <Icon style={{ color: 'white', fontSize: '14px' }} type="bug_report" />
                                </div>
                              </Tooltip>
                            </Option>
                          </Select>
                          <div style={{ marginLeft: 8, flexGrow: 1 }}>
                            <Input
                              autoFocus
                              value={this.state.createIssueValue}
                              placeholder="需要做什么"
                              onChange={(e) => {
                                this.setState({
                                  createIssueValue: e.target.value,
                                });
                              }}
                              maxLength={30}
                              onPressEnter={this.handleBlurCreateIssue.bind(this)}
                              // onBlur={this.handleBlurCreateIssue.bind(this)}
                            />
                          </div>
                        </div>
                        <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-start', paddingRight: 70 }}>
                          <Button 
                            type="primary"
                            onClick={() => {
                              this.setState({
                                createIssue: false,
                              });
                            }}
                          >取消</Button>
                          <Button
                            type="primary"
                            loading={this.state.loading}
                            onClick={this.handleBlurCreateIssue.bind(this)}
                          >确定</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="c7n-backlog-sprintIssueSide">
                        <Icon
                          className="c7n-backlog-createIssue"
                          type="playlist_add"
                          role="none"
                          style={{
                            cursor: 'pointer',
                          }}
                          onClick={() => {
                            this.setState({
                              createIssue: true,
                              createIssueValue: '',
                            });
                          }}
                        >创建问题</Icon>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </Droppable>
        ) : ''}
      </div>
    );
  }
}

export default SprintItem;
