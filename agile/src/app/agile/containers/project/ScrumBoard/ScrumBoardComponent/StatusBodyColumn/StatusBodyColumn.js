import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Droppable } from 'react-beautiful-dnd';
import _ from 'lodash';
import ScrumBoardStore from '../../../../../stores/project/scrumBoard/ScrumBoardStore';
import StatusIssue from '../StatusIssue/StatusIssue';
import './StatusBodyColumn.scss';

@inject('AppState')
@observer
class StatusBodyColumn extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }
  judgeMinHeight(dragStartData, issues) {
    if (JSON.stringify(dragStartData) === '{}') {
      return true;
    } else {
      let flag = 0;
      if (String(JSON.parse(ScrumBoardStore.getDragStartItem.source.droppableId).parentId) === 
        String(this.props.source)) {
        if (issues.length === 0) {
          flag = 1;
        }
      }
      if (flag === 1) {
        return false;
      } else {
        return true;
      }
    }
  }
  renderIssues(issues, droppableId, statusName, categoryCode) {
    const data = issues;
    const result = [];
    const parentIds = [];
    _.forEach(ScrumBoardStore.getParentIds, (pi) => {
      parentIds.push(pi.issueId);
    });
    if (!this.props.parentId) {
      _.forEach(data, (item, index) => {
        if (!item.parentIssueId) {
          if (_.indexOf(parentIds, item.issueId) === -1) {
            result.push(
              <StatusIssue
                data={item}
                index={index}
                droppableId={droppableId}
                statusName={statusName}
                categoryCode={categoryCode}
              />,
            );
          }
        }
      });
    } else {
      _.forEach(data, (item, index) => {
        if (item.parentIssueId === this.props.parentId) {
          result.push(
            <StatusIssue
              data={item}
              index={index}
              droppableId={droppableId}
              statusName={statusName}
              categoryCode={categoryCode}
            />,
          );
        }
      });
    }
    return result;
  }
  renderBackground(isDraggingOver) {
    // 如果拖动过这个drop
    if (isDraggingOver) {
      return 'rgba(26,177,111,0.08)';
    } else if (
      JSON.stringify(ScrumBoardStore.getDragStartItem) !== '{}') {
      // 如果开始拖动 并且拖动的issue在当前source里
      if (String(JSON.parse(ScrumBoardStore.getDragStartItem.source.droppableId).parentId) === 
        String(this.props.source)
      ) {
        return 'rgba(140,158,255,0.12)';
      } else {
        return 'rgba(0, 0, 0, 0.04)';
      }
    } else {
      return 'rgba(0, 0, 0, 0.04)';
    }
  }
  // 这里是拖动issue 不会显示同一列的其他状态drop
  renderDisplay(item, type) {
    const data = ScrumBoardStore.getDragStartItem;
    // 如果没有开始拖动 则都显示
    if (JSON.stringify(data) === '{}') {
      if (type === 'visibility') {
        return 'visible';
      } else {
        return '100%';
      }
    } else {
      const dropCode = JSON.parse(data.source.droppableId).code;
      const currentStatusList = [];
      _.forEach(this.props.data.subStatuses, (i) => {
        currentStatusList.push(i.id);
      });
      let flag = 0;
      if (_.indexOf(currentStatusList, dropCode) !== -1) {
        // 如果当前列的状态包含拖动卡片的状态列
        if (item.id !== dropCode) {
          // 并且当前状态列的id不等于拖动时的状态列id
          flag = 1;
        }
      }
      if (flag === 1) {
        if (type === 'visibility') {
          return 'hidden';
        } else {
          return 0;
        }
      } else if (type === 'visibility') {
        return 'visible';
      } else {
        return '100%';
      }
    }
  }
  renderBorder(data, index, position, drag) {
    if (String(JSON.parse(ScrumBoardStore.getDragStartItem.source.droppableId).parentId) === 
    String(this.props.source)) {
      // 如果在同一个泳道
      if (String(JSON.parse(ScrumBoardStore.getDragStartItem.source.droppableId).columnId) !== 
      String(this.props.data.columnId)) {
        let flag = 0;
        // 如果不在同一列
        if (data.length === 1) {
          // 如果只有一个状态
          if (drag) {
            return '2px dashed #1AB16F';
          } else {
            return '2px dashed #26348B';
          }
        } else {
          // 如果有多个状态
          if (index > 0) {
            if (position === 'top') {
              // 如果当前状态不是第一个 并且是top border
              flag = 1;
            }
          }
          if (flag === 1) {
            return 'unset';
          } else if (drag) {
            return '2px dashed #1AB16F';
          } else {
            return '2px dashed #26348B';
          }
        }
      } else if (drag) {
        return '2px dashed #1AB16F';
      } else {
        return '2px dashed #26348B';
      }
    } else {
      return 'unset';
    }
  }
  renderStatusDisplay(dragStartData, data) {
    if (JSON.stringify(dragStartData) !== '{}') {
      let flag = 0;
      if (data.length > 1) {
        if (String(JSON.parse(ScrumBoardStore.getDragStartItem.source.droppableId).parentId) === 
        String(this.props.source)) {
          flag = 1;
        }
      }
      if (flag === 0) {
        return 'none';
      } else {
        return 'flex';
      }
    } else {
      return 'none';
    }
  }
  renderStatusColumn() {
    const dragStartData = ScrumBoardStore.getDragStartItem;
    const data = this.props.data.subStatuses;
    const result = [];
    // `${this.props.data.columnId},${item.code}`
    _.forEach(data, (item, index) => {
      result.push(
        <Droppable 
          droppableId={
            JSON.stringify({
              columnId: this.props.data.columnId,
              code: item.id,
              parentId: this.props.source,
            })
          }
        >
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              style={{
                background: this.renderBackground(snapshot.isDraggingOver),
                padding: 'grid',
                // border: JSON.stringify(dragStartData) === '{}' ? 'unset' : '2px dashed #26348B',
                borderTop: JSON.stringify(dragStartData) === '{}' ? 
                  'unset' : this.renderBorder(data, index, 'top', snapshot.isDraggingOver),
                borderLeft: JSON.stringify(dragStartData) === '{}' ? 
                  'unset' : this.renderBorder(data, index, 'left', snapshot.isDraggingOver),
                borderRight: JSON.stringify(dragStartData) === '{}' ? 
                  'unset' : this.renderBorder(data, index, 'right', snapshot.isDraggingOver),
                borderBottom: JSON.stringify(dragStartData) === '{}' ? 
                  'unset' : this.renderBorder(data, index, 'bottom', snapshot.isDraggingOver),
                visibility: this.renderDisplay(item, 'visibility'),
                height: this.renderDisplay(item, 'height'),
                // display: 'block',
                position: 'relative',
                // ...this.judgeMinHeight(dragStartData, item.issues) ? {
                // } : {
                //   minHeight: 83,
                // },
              }}
            >
              <p
                style={{
                  display: this.renderStatusDisplay(dragStartData, data),
                  fontSize: '18px',
                  color: 'rgb(38, 52, 139)',
                  lineHeight: '26px',
                  // position: 'absolute',
                  // width: '100%',
                  // height: '100%',
                  // justifyContent: 'center',
                  // alignItems: 'center',
                  // zIndex: 10,
                }}
              >
                {item.name}
              </p>
              <div style={{ minHeight: 83 }}>
                {this.renderIssues(item.issues, item.id, item.name, item.categoryCode)}
              </div>
            </div>
          )}
        </Droppable>,
      );
    });
    return result;
  }
  render() {
    return (
      <div className="c7n-scrumboard-statusBody">
        {this.renderStatusColumn()}
      </div>
    );
  }
}

export default StatusBodyColumn;

