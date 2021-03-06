import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Page, Header, Content, stores } from 'choerodon-front-boot';
import { Button, Select, Spin, message, Icon, Modal, Input, Form } from 'choerodon-ui';
import _ from 'lodash';
import { DragDropContext } from 'react-beautiful-dnd';
import { withRouter } from 'react-router-dom';
import axios from 'axios';
import ScrumBoardStore from '../../../../stores/project/scrumBoard/ScrumBoardStore';
import StatusColumn from '../ScrumBoardComponent/StatusColumn/StatusColumn';
import StatusBodyColumn from '../ScrumBoardComponent/StatusBodyColumn/StatusBodyColumn';
import './ScrumBoardHome.scss';
import '../../../main.scss';
import IssueDetail from '../ScrumBoardComponent/IssueDetail/IssueDetail';
import SwimLaneContext from '../ScrumBoardComponent/SwimLaneContext/SwimLaneContext';
import BacklogStore from '../../../../stores/project/backlog/BacklogStore';
import CloseSprint from '../../Backlog/BacklogComponent/SprintComponent/CloseSprint';
import EmptyScrumboard from '../../../../assets/image/emptyScrumboard.png';

const Option = Select.Option;
const { Sidebar } = Modal;
const FormItem = Form.Item;
let scroll;
const { AppState } = stores;
const confirm = Modal.confirm;

@observer
class ScrumBoardHome extends Component {
  constructor(props) {
    super(props);
    this.state = {
      spinIf: false,
      selectedBoard: '',
      onlyMe: false,
      recent: false,
      expand: true,
      addBoard: false,
      closeSprintVisible: false,
      judgeUpdateParent: {},
      updateParentStatus: null,
    };
  }
  componentWillMount() {
    this.getBoard();
  }
  getBoard() {
    ScrumBoardStore.axiosGetBoardList().then((data) => {
      ScrumBoardStore.setBoardList(data);
      ScrumBoardStore.setCurrentConstraint(data[0].columnConstraint);
      if (!ScrumBoardStore.getSelectedBoard) {
        ScrumBoardStore.setSelectedBoard(data[0].boardId);
        this.refresh(data[0].boardId);
      } else {
        let flag = 0;
        _.forEach(data, (da) => {
          if (data.boardId === ScrumBoardStore.getSelectedBoard) {
            flag += 1;
          }
        });
        if (flag > 0) {
          this.refresh(ScrumBoardStore.getSelectedBoard);
        } else {
          ScrumBoardStore.setSelectedBoard(data[0].boardId);
          this.refresh(data[0].boardId);
        }
      }
    }).catch((error) => {
      window.console.log(error);
    });
  }
  refresh(boardId) {
    this.setState({
      spinIf: true,
    });
    ScrumBoardStore.axiosGetBoardData(boardId).then((data) => {
      const parentIds = [];
      const storeParentIds = [];
      _.forEach(data.columnsData.columns, (col) => {
        _.forEach(col.subStatuses, (sub) => {
          _.forEach(sub.issues, (iss) => {
            if (data.parentIds.indexOf(parseInt(iss.issueId, 10)) !== -1) {
              if (parentIds.indexOf(iss.issueId) === -1) {
                parentIds.push(iss.issueId);
                storeParentIds.push({
                  status: sub.name,
                  categoryCode: sub.categoryCode,
                  ...iss,
                });
              }
            }
          });
        });
      });
      ScrumBoardStore.setCurrentSprint(data.currentSprint);
      ScrumBoardStore.setParentIds(storeParentIds);
      ScrumBoardStore.setBoardData(data.columnsData.columns);
      // this.storeIssueNumberCount(storeParentIds, )
      this.setState({
        spinIf: false,
      });
    }).catch((error) => {
      window.console.log(error);
    });
  }
  // storeIssueNumberCount(storeParentIds, columns) {

  // }
  handleDragEnd(result) {
    ScrumBoardStore.setDragStartItem({});
    if (!result.destination) {
      return;
    }
    const originState = JSON.parse(JSON.stringify(ScrumBoardStore.getBoardData));
    let flag = 0;
    if (ScrumBoardStore.getCurrentConstraint === 'issue') {
      // 问题计数
      if (JSON.parse(result.source.droppableId).columnId !== 
      JSON.parse(result.destination.droppableId).columnId) {
        // 如果是拖不同列
        _.forEach(originState, (ori, oriIndex) => {
          if (String(ori.columnId) === String(JSON.parse(result.source.droppableId).columnId)) {
            let totalIssues = 0;
            _.forEach(ori.subStatuses, (sub) => {
              totalIssues += sub.issues.length;
            });
            if (ori.minNum >= totalIssues) {
              flag = 1;
              message.info(`少于列${ori.name}的最小长度，无法更新`);
            }
          }
        });
        _.forEach(originState, (ori, oriIndex) => {
          if (String(ori.columnId) === 
          String(JSON.parse(result.destination.droppableId).columnId)) {
            let totalIssues = 0;
            _.forEach(ori.subStatuses, (sub) => {
              totalIssues += sub.issues.length;
            });
            if (ori.maxNum <= totalIssues) {
              flag = 1;
              message.info(`多于列${ori.name}的最大长度，无法更新`);
            }
          }
        });
      }
    } else if (ScrumBoardStore.getCurrentConstraint === 'issue_without_sub_task') {
      // 问题计数 不包含子任务
      if (JSON.parse(result.source.droppableId).columnId !== 
      JSON.parse(result.destination.droppableId).columnId) {
        // 如果是拖不同列
        _.forEach(originState, (ori, oriIndex) => {
          if (String(ori.columnId) === String(JSON.parse(result.source.droppableId).columnId)) {
            let totalIssues = 0;
            _.forEach(ori.subStatuses, (sub) => {
              _.forEach(sub.issues, (iss) => {
                if (iss.typeCode !== 'sub_task') {
                  totalIssues += 1;
                }
              });
            });
            if (ori.minNum >= totalIssues) {
              flag = 1;
              message.info(`少于列${ori.name}的最小长度，无法更新`);
            }
          }
        });
        _.forEach(originState, (ori, oriIndex) => {
          if (String(ori.columnId) === 
          String(JSON.parse(result.destination.droppableId).columnId)) {
            let totalIssues = 0;
            _.forEach(ori.subStatuses, (sub) => {
              _.forEach(sub.issues, (iss) => {
                if (iss.typeCode !== 'sub_task') {
                  totalIssues += 1;
                }
              });
            });
            if (ori.maxNum <= totalIssues) {
              flag = 1;
              message.info(`多于列${ori.name}的最大长度，无法更新`);
            }
          }
        });
      }
    }
    if (flag === 0) {
      // this.setState({
      //   spinIf: true,
      // });
      const newState = _.clone(ScrumBoardStore.getBoardData);
      const issueId = JSON.parse(result.draggableId).issueId;
      const objectVersionNumber = JSON.parse(result.draggableId).objectVersionNumber;
      const statusCode = JSON.parse(result.destination.droppableId).code;
      // const splitData = result.draggableId.split(',');
      // const splitData2 = result.destination.droppableId.split(',');
      let draggableData = {};
      _.forEach(newState, (item, index) => {
        if (String(item.columnId) === String(JSON.parse(result.source.droppableId).columnId)) {
          _.forEach(newState[index].subStatuses, (item2, index2) => {
            if (String(item2.id) === String(JSON.parse(result.source.droppableId).code)) {
              let spliceIndex = '';
              _.forEach(newState[index].subStatuses[index2].issues, (item3, index3) => {
                if (String(item3.issueId) === String(issueId)) {
                  spliceIndex = index3;
                }
              });
              draggableData = 
              newState[index].subStatuses[index2].issues.splice(spliceIndex, 1)[0];
            }
          });
        }
      });
      ScrumBoardStore.setBoardData(newState);
      let destinationStatus;
      ScrumBoardStore.updateIssue(
        issueId, objectVersionNumber, statusCode, ScrumBoardStore.getSelectedBoard,
        JSON.parse(result.source.droppableId).columnId, 
        JSON.parse(result.destination.droppableId).columnId,
      ).then((data) => {
        draggableData.objectVersionNumber = data.objectVersionNumber;
        _.forEach(newState, (item, index) => {
          if (String(item.columnId) === 
          String(JSON.parse(result.destination.droppableId).columnId)) {
            _.forEach(newState[index].subStatuses, (item2, index2) => {
              if (String(item2.id) === 
              String(JSON.parse(result.destination.droppableId).code)) {
                destinationStatus = item2.categoryCode;
                newState[index].subStatuses[index2].issues.splice(
                  result.destination.index, 0, draggableData);
              }
            });
          }
        });
        ScrumBoardStore.setBoardData(newState);
        if (draggableData.parentIssueId) {
          if (destinationStatus === 'done') {
            let parentIdCode;
            let parentIdNum;
            let parentObjectVersionNumber;
            _.forEach(ScrumBoardStore.getParentIds, (pi) => {
              if (pi.issueId === draggableData.parentIssueId) {
                parentIdCode = pi.categoryCode;
                parentIdNum = pi.issueNum;
                parentObjectVersionNumber = pi.objectVersionNumber;
              }
            });
            const judge = ScrumBoardStore.judgeMoveParentToDone(
              parentIdCode, draggableData.parentIssueId);
            if (judge) {
              this.setState({
                judgeUpdateParent: {
                  id: draggableData.parentIssueId,
                  issueNumber: parentIdNum,
                  code: parentIdCode,
                  objectVersionNumber: parentObjectVersionNumber,
                },
              });
            }
          }
        }
      }).catch((error) => {
        ScrumBoardStore.setBoardData(JSON.parse(JSON.stringify(originState)));
        window.console.log(error);
      });
    }
  }
  handleCreateBoard(e) {
    e.preventDefault();
    this.props.form.validateFields((err, values) => {
      if (!err) {
        ScrumBoardStore.axiosCreateBoard(values.name).then((res) => {
          this.setState({
            addBoard: false,
          });
          this.getBoard();
        }).catch((error) => {
          window.console.log(error);
        });
      }
    });
  }
  // 渲染第三方状态列
  renderStatusColumns() {
    const data = ScrumBoardStore.getBoardData;
    const result = [];
    _.forEach(data, (item) => {
      if (item.subStatuses.length > 0) {
        result.push(
          <StatusColumn
            data={item}
          />,
        );
      }
    });
    return result;
  }
  // 渲染issue列
  renderIssueColumns(parentId) {
    const data = ScrumBoardStore.getBoardData;
    const result = [];
    _.forEach(data, (item) => {
      if (item.subStatuses.length > 0) {
        result.push(
          <StatusBodyColumn
            data={item}
            parentId={parentId}
            source={_.isUndefined(parentId) ? 'other' : parentId}
          />,
        );
      }
    });
    return result;
  }
  renderSwimlane() {
    const parentIds = ScrumBoardStore.getParentIds;
    const result = [];
    _.forEach(parentIds, (item) => {
      result.push(
        <SwimLaneContext
          data={item}
          handleDragEnd={this.handleDragEnd.bind(this)}
          renderIssueColumns={this.renderIssueColumns.bind(this)}
          changeState={(name, value) => {
            this.setState({
              [name]: value, 
            });
          }}
        />,
      );
    });
    return result;
  }
  renderHeight() {
    if (document.getElementsByClassName('c7n-scrumboard-content').length > 0) {
      return `calc(100vh - ${parseInt(document.getElementsByClassName('c7n-scrumboard-content')[0].offsetTop, 10) + 48}px)`;
    }
    return '';
  }
  renderUpdateParentDefault() {
    if (ScrumBoardStore.getBoardData.length > 0) {
      if (ScrumBoardStore.getBoardData[ScrumBoardStore.getBoardData.length - 1].columnId !== 'unset') {
        if (ScrumBoardStore.getBoardData[
          ScrumBoardStore.getBoardData.length - 1].subStatuses.length > 0) {
          return ScrumBoardStore.getBoardData[
            ScrumBoardStore.getBoardData.length - 1].subStatuses[0].id;
        }
      }
    }
    return undefined;
  }
  render() {
    const { getFieldDecorator } = this.props.form;
    return (
      <Page className="c7n-scrumboard-page">
        <Spin spinning={this.state.spinIf}>
          <Header title="活跃冲刺">
            <Button 
              funcTyp="flat"
              onClick={() => {
                this.setState({
                  addBoard: true,
                });
              }}
            >
              <Icon type="playlist_add icon" />
              <span>创建看板</span>
            </Button>
            <Select 
              className="leftBtn2" 
              value={ScrumBoardStore.getSelectedBoard}
              style={{ width: 100, color: '#3F51B5', margin: '0 30px' }}
              dropdownStyle={{
                color: '#3F51B5',
              }}
              onChange={(value) => {
                _.forEach(ScrumBoardStore.getBoardList, (item) => {
                  if (item.boardId === value) {
                    ScrumBoardStore.setCurrentConstraint(item.columnConstraint);
                  }
                });
                ScrumBoardStore.setSelectedBoard(value);
                this.refresh(value);
              }}
            >
              {
                ScrumBoardStore.getBoardList.map(item => (
                  <Option value={item.boardId}>{item.name}</Option>
                ))
              }
            </Select>
            <Button className="leftBtn2" funcTyp="flat" onClick={this.refresh.bind(this, ScrumBoardStore.getSelectedBoard)}>
              <Icon type="refresh icon" />
              <span>刷新</span>
            </Button>
          </Header>
          <Content style={{ padding: 0, display: 'flex' }}>
            <div style={{ flexGrow: 1 }}>
              <div className="c7n-scrumTools">
                <div className="c7n-scrumTools-left">
                  <p style={{ marginRight: 24 }}>快速搜索:</p>
                  <p
                    className="c7n-scrumTools-filter"
                    style={{
                      background: this.state.onlyMe ? 'rgba(140, 158, 255, 0.2)' : '',
                      color: this.state.onlyMe ? '#3f51b5' : '',
                    }}
                    role="none"
                    onClick={() => {
                      this.setState({
                        onlyMe: !this.state.onlyMe,
                        spinIf: true,
                      }, () => {
                        ScrumBoardStore.axiosFilterBoardData(
                          ScrumBoardStore.getSelectedBoard, 
                          this.state.onlyMe ? AppState.getUserId : 0, 
                          this.state.recent).then((data) => {
                          const parentIds = [];
                          const storeParentIds = [];
                          _.forEach(data.columnsData.columns, (col) => {
                            _.forEach(col.subStatuses, (sub) => {
                              _.forEach(sub.issues, (iss) => {
                                if (data.parentIds.indexOf(parseInt(iss.issueId, 10)) !== -1) {
                                  if (parentIds.indexOf(iss.issueId) === -1) {
                                    parentIds.push(iss.issueId);
                                    storeParentIds.push({
                                      status: sub.name,
                                      categoryCode: sub.categoryCode,
                                      subIssues: [],
                                      ...iss,
                                    });
                                  }
                                }
                              });
                            });
                          });
                          ScrumBoardStore.setUnParentIds([]);
                          ScrumBoardStore.setCurrentSprint(data.currentSprint);
                          ScrumBoardStore.setParentIds(storeParentIds);
                          ScrumBoardStore.setBoardData(data.columnsData.columns);
                          this.setState({
                            spinIf: false,
                          });
                        }).catch((error) => {
                          window.console.log(error);
                          this.setState({
                            spinIf: false,
                          });
                        });
                      });
                    }}
                  >仅我的问题</p>
                  <p
                    className="c7n-scrumTools-filter"
                    style={{
                      background: this.state.recent ? 'rgba(140, 158, 255, 0.2)' : '',
                      color: this.state.recent ? '#3f51b5' : '',
                    }}
                    role="none"
                    onClick={() => {
                      this.setState({
                        recent: !this.state.recent,
                        spinIf: true,
                      }, () => {
                        ScrumBoardStore.axiosFilterBoardData(
                          ScrumBoardStore.getSelectedBoard, 
                          this.state.onlyMe ? AppState.getUserId : 0, 
                          this.state.recent).then((data) => {
                          const parentIds = [];
                          const storeParentIds = [];
                          _.forEach(data.columnsData.columns, (col) => {
                            _.forEach(col.subStatuses, (sub) => {
                              _.forEach(sub.issues, (iss) => {
                                if (data.parentIds.indexOf(parseInt(iss.issueId, 10)) !== -1) {
                                  if (parentIds.indexOf(iss.issueId) === -1) {
                                    parentIds.push(iss.issueId);
                                    storeParentIds.push({
                                      status: sub.name,
                                      categoryCode: sub.categoryCode,
                                      subIssues: [],
                                      ...iss,
                                    });
                                  }
                                }
                              });
                            });
                          });      
                          ScrumBoardStore.setUnParentIds([]);
                          ScrumBoardStore.setParentIds(storeParentIds);
                          ScrumBoardStore.setBoardData(data.columnsData.columns);
                          this.setState({
                            spinIf: false,
                          });
                        }).catch((error) => {
                          window.console.log(error);
                          this.setState({
                            spinIf: false,
                          });
                        });
                      });
                    }}
                  >仅故事</p>
                </div>
                <div className="c7n-scrumTools-right" style={{ display: 'flex', alignItems: 'center' }}>
                  <Icon
                    style={{
                      display: ScrumBoardStore.getCurrentSprint ? 'inline-block' : 'none', 
                      color: 'rgba(0,0,0,0.54)',
                    }}
                    type="av_timer"
                  />
                  <span style={{ marginLeft: 0 }}>{`${ScrumBoardStore.getCurrentSprint ? ScrumBoardStore.getCurrentSprint.dayRemain : ''}days剩余`}</span>
                  <Button
                    funcTyp="flat"
                    onClick={() => {
                      BacklogStore.axiosGetSprintCompleteMessage(
                        ScrumBoardStore.getCurrentSprint.sprintId).then((res) => {
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
                  >
                    <Icon type="power_settings_new icon" />
                    <span style={{ marginLeft: 0 }}>完成Sprint</span>
                  </Button>
                  <Button
                    funcTyp="flat"
                    onClick={() => {
                      const { history } = this.props;
                      const urlParams = AppState.currentMenuType;
                      history.push(`/agile/scrumboard/setting?type=${urlParams.type}&id=${urlParams.id}&name=${urlParams.name}`);
                    }}
                  >
                    <Icon type="settings icon" />
                    <span style={{ marginLeft: 0 }}>配置</span>
                  </Button>
                </div>
              </div>
              {
                this.state.closeSprintVisible ? (
                  <CloseSprint
                    visible={this.state.closeSprintVisible}
                    onCancel={() => {
                      this.setState({
                        closeSprintVisible: false,
                      });
                    }}
                    data={{
                      sprintId: ScrumBoardStore.getCurrentSprint.sprintId,
                      sprintName: ScrumBoardStore.getCurrentSprint.sprintName,
                    }}
                    refresh={this.getBoard.bind(this)}
                  />
                ) : ''
              }
              <div className="c7n-scrumboard">
                <div className="c7n-scrumboard-header">
                  {this.renderStatusColumns()}
                </div>
                <div
                  className="c7n-scrumboard-content"
                  style={{
                    height: this.renderHeight(),
                    paddingBottom: 83,
                  }}
                >
                  {this.renderSwimlane()}
                  {ScrumBoardStore.getCurrentSprint ? (
                    <div className="c7n-scrumboard-others">
                      <div className="c7n-scrumboard-otherHeader">
                        <Icon 
                          style={{ fontSize: 17, cursor: 'pointer', marginRight: 8 }}
                          type={this.state.expand ? 'keyboard_arrow_down' : 'keyboard_arrow_right'}
                          role="none"
                          onClick={() => {
                            this.setState({
                              expand: !this.state.expand,
                            });
                          }}
                        />
                  其他问题
                        {/* <p style={{ marginLeft: 12, color: '
                    rgba(0,0,0,0.54)' }}>{`(${ScrumBoardStore.getUnParentIds.length} 问题)`}</p> */}
                      </div>
                      <div
                        className="c7n-scrumboard-otherContent"
                        style={{
                          display: this.state.expand ? 'flex' : 'none',
                        }}
                      >
                        <DragDropContext 
                          onDragEnd={this.handleDragEnd.bind(this)}
                          onDragStart={(start) => {
                            ScrumBoardStore.setDragStartItem(start);
                          }}
                        >
                          {this.renderIssueColumns()}
                        </DragDropContext>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: '80px',
                      }}
                    >
                      <img style={{ width: 170 }} src={EmptyScrumboard} alt="emptyscrumboard" />
                      <div
                        style={{
                          marginLeft: 40,
                        }}
                      >
                        <p style={{ color: 'rgba(0,0,0,0.65)' }}>没有活动的Sprint</p>
                        <p style={{ fontSize: 20, lineHeight: '34px' }}>在<span style={{ color: '#3f51b5' }}>待办事项</span>中开始Sprint</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <IssueDetail
              visible={JSON.stringify(ScrumBoardStore.getClickIssueDetail) !== '{}'}
            />
            <Modal
              closable={false}
              title="更新父问题"
              visible={JSON.stringify(this.state.judgeUpdateParent) !== '{}'}
              onCancel={() => {
                this.setState({
                  judgeUpdateParent: {},
                  updateParentStatus: null,
                });
              }}
              onOk={() => {
                const data = {
                  issueId: this.state.judgeUpdateParent.id,
                  objectVersionNumber: this.state.judgeUpdateParent.objectVersionNumber,
                  statusId: this.state.updateParentStatus ? 
                    this.state.updateParentStatus : ScrumBoardStore.getBoardData[
                      ScrumBoardStore.getBoardData.length - 1].subStatuses[0].id,
                };
                BacklogStore.axiosUpdateIssue(data).then((res) => {
                  this.refresh(ScrumBoardStore.getSelectedBoard);
                  this.setState({
                    judgeUpdateParent: {},
                    updateParentStatus: null,
                  });
                }).catch((error) => {
                  window.console.log(error);
                });
              }}
            >
              <p>任务{this.state.judgeUpdateParent.issueNumber}的全部子任务为done</p>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <p style={{ marginRight: 20 }}>您是否要更新父问题进行匹配</p>
                <Select 
                  style={{
                    width: 250,
                  }}
                  onChange={(value) => {
                    this.setState({
                      updateParentStatus: value,
                    });
                  }}
                  defaultValue={this.renderUpdateParentDefault()}
                >
                  {
                    ScrumBoardStore.getBoardData.length > 0 ?
                      ScrumBoardStore
                        .getBoardData[ScrumBoardStore.getBoardData.length - 1].subStatuses
                        .map(item => (
                          <Option value={item.id}>{item.name}</Option>
                        )) : ''
                  }
                </Select>
              </div>
            </Modal>
            <Sidebar
              title="创建看板"
              visible={this.state.addBoard}
              onCancel={() => {
                this.setState({
                  addBoard: false,
                });
              }}
              okText="创建"
              cancelText="取消"
              onOk={this.handleCreateBoard.bind(this)}
            >
              <Content
                style={{ padding: 0 }}
                title={`创建项目“${AppState.currentMenuType.name}”的看板`}
                description="请在下面输入看板名称，创建一个新的board。新的board会默认为您创建'待处理'、'处理中'、'已完成'三个列，同时将todo、doing、done三个类别的状态自动关联入三个列中。"
              >
                <Form>
                  <FormItem>
                    {getFieldDecorator('name', {
                      rules: [{
                        required: true, message: '看板名是必须的',
                      }],
                    })(
                      <Input
                        style={{
                          width: 512,
                        }}
                        label="看板名称"
                      />,
                    )}
                  </FormItem>
                </Form>
              </Content>
            </Sidebar>
          </Content>
        </Spin>
      </Page>
    );
  }
}

export default Form.create()(ScrumBoardHome);

