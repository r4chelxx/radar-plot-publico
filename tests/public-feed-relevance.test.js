'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {isRelevant}=require('../scripts/public-feed-relevance');
test('rejects unrelated news and generic navigation',()=>{assert.equal(isRelevant('I went looking for the source of one little statistic'),false);assert.equal(isRelevant('Read more'),false)});
test('accepts opportunities, datasets and tools in English and Portuguese',()=>{for(const title of ['Funding for investigative journalism','Open call for reporting fellows','Novo edital para bolsas de jornalismo','Open data research dataset'])assert.equal(isRelevant(title),true,title)});
