import {test} from 'node:test';
import assert from 'node:assert/strict';
import {matchesQuery} from '../public/search.js';

const record = {
  id: 'fb-224b0f18-f1b4-492e-a70c-7a396b98373f',
  nickname: '夜雨炊烟',
  site: '寻巷',
  type: '问题',
  status: '待处理',
  reason: '',
  description: '无会话时列表透明度太高',
  visitorId: 'ae170f53-57e7-4308-8dcb-8ee18c1cd0f3',
  createdAt: '2026-11-22T03:47:08.653Z',
  attachments: [{name: 'IMG_2440.png'}]
};

test('blank query matches every record', () => {
  assert.equal(matchesQuery(record, ''), true);
  assert.equal(matchesQuery(null, '  '), true);
});

test('query matches ID, nickname, site, content and attachment names', () => {
  assert.equal(matchesQuery(record, '224B0F18'), true);
  assert.equal(matchesQuery(record, '炊烟'), true);
  assert.equal(matchesQuery(record, '寻巷'), true);
  assert.equal(matchesQuery(record, '透明度'), true);
  assert.equal(matchesQuery(record, 'img_2440'), true);
});

test('multiple query terms can match across different fields', () => {
  assert.equal(matchesQuery(record, '寻巷 夜雨 待处理'), true);
  assert.equal(matchesQuery(record, '寻巷 拾萤'), false);
});

test('missing fields do not break queries', () => {
  assert.equal(matchesQuery({id:'fb-legacy', description:'旧反馈'}, '旧反馈'), true);
  assert.equal(matchesQuery(null, '反馈'), false);
});
