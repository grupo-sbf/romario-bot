# -*- coding: utf-8 -*-

import ConfigParser
import re
import os
import json
import logging
import requests
import re
from datetime import datetime, timedelta

class Repo:

	def __init__(self, ghrepo):
		self.ghrepo = ghrepo

	# Retorna dados das issues abertas
	def open_issues(self, tags):
		issues = []
		leadtime = []

		url = 'https://api.github.com/repos/' + os.environ['gh_organization'] + '/' + self.ghrepo + '/issues?per_page=100' + \
				'&state=open&sort=created&direction=asc'

		while url is not None:
			response = requests.get(url, auth=(os.environ['user'], os.environ['pass']))
			data = response.json()

			link = response.headers.get('link', None)
			if link is not None:
				url = next_page(link)
			else:
				url = None

			prog = tag_regex(tags)
			for issue in data:			
				if prog.search(str(issue['labels'])) is not None and 'pull_request' not in issue:
					dateCreated = datetime.strptime(issue['created_at'], '%Y-%m-%dT%H:%M:%SZ')
					dateCurrent = datetime.now()
					delta = dateCurrent - dateCreated

					issues.append({'issue': issue['number'], 
									'created_at': issue['created_at'],
									'leadtime': delta.days})

					leadtime.append(delta.days)

		return {'leadtime': [mean(leadtime), stddev(leadtime)], 'openIssues': issues}

	# Retorna dados das issues abertas
	def cfd(self, fromDateObj, toDateObj, tags, average):
		issues = []

		url = 'https://api.github.com/repos/'+ os.environ['gh_organization'] + '/' + self.ghrepo + '/issues?per_page=100&since=' + \
				fromDateObj.strftime('%Y-%m-%dT%H:%M:%SZ') + '&state=closed&sort=created&direction=asc'

		run_cfd(url, self.ghrepo, tags, issues)

		url = 'https://api.github.com/repos/' + os.environ['gh_organization'] + '/' + self.ghrepo + '/issues?per_page=100' + \
				'&state=open&sort=created&direction=asc'

		run_cfd(url, self.ghrepo, tags, issues)

		return {'dateFrom': fromDateObj.strftime('%Y-%m-%d'), \
		  'dateTo': toDateObj.strftime('%Y-%m-%d'), \
		  'cfd': issues}

	def run_cfd(url, tags, issues):
		while url is not None:
			response = requests.get(url, auth=(os.environ['user'], os.environ['pass']))
			data = response.json()

			link = response.headers.get('link', None)
			if link is not None:
				url = next_page(link)
			else:
				url = None

			prog = tag_regex(tags)
			for issue in data:			
				if prog.search(str(issue['labels'])) is not None and 'pull_request' not in issue:

				#if prog.search(str(issue['labels'])) is not None and 'pull_request' not in issue:
					issueArr = {'issue': issue['number'], \
								'created_at': issue['created_at'].split('T')[0]}

					if issue['closed_at'] is not None:
						issueArr['closed_at']=(issue['closed_at'].split('T')[0])

					if ('assignee' in issue and issue['assignee'] is not None):
						url2 = 'https://api.github.com/repos/' + os.environ['gh_organization'] + '/' + self.ghrepo + '/issues/' + str(issue['number']) + '/events?per_page=500'
						response2 = requests.get(url2, auth=(os.environ['user'], os.environ['pass']))
						dataEvnt = response2.json()

						dateAssigned = None

						for event in dataEvnt:
							if event['event'] == 'assigned':
								issueArr['assigned_at'] = event['created_at'].split('T')[0]
								break

					issues.append(issueArr)

	# Retorna dados das issues fechadas
	def closed_issues(self, fromDateObj, toDateObj, tags, average):
		if average is None:
			config = ConfigParser.RawConfigParser()
			config.read('command.cfg')
			average = config.getint('github', 'average')

		if toDateObj is None:
			toDateObj = datetime.now().replace(hour=23, minute=59, second=59)
		
		if fromDateObj is None:
			fromDateObj = datetime.now().replace(hour=00, minute=00, second=00) - timedelta(days=average)

		# Cria objetos que vão ser retornados
		throughput = {}
		thrAvgHelper = {}
		ltAvgHelper = {}
		leadtime = {}
		ret = {'self.repo.ghrepo': self.ghrepo ,'tagsTitles': tags, 'throughput' : throughput, 'leadtime': leadtime}
		fromDateObjAvg = fromDateObj - timedelta(days=(average-1))

		# Preenche com as chaves iniciais
		d = fromDateObjAvg
		while d <= toDateObj:
			tagsRet = [0] * len(tags)
			thrAvgHelper[d.strftime("%Y-%m-%d")] = [0, tagsRet]
			ltAvgHelper[d.strftime("%Y-%m-%d")] = []
			if d >= fromDateObj:
				tagsRet = [0] * len(tags)
				throughput[d.strftime("%Y-%m-%d")] = [None,0,tagsRet]
				leadtime[d.strftime("%Y-%m-%d")] = [None]
			d += timedelta(days=1)

		# Busca os dados no GitHub
		url = 'https://api.github.com/repos/' + os.environ['gh_organization'] + '/' + self.ghrepo + '/issues?per_page=500&state=closed&since=' + fromDateObjAvg.strftime('%Y-%m-%dT%H:%M:%SZ')
		
		while url is not None:
			response = requests.get(url, auth=(os.environ['user'], os.environ['pass']))
			data = response.json()

			link = response.headers.get('link', None)
			if link is not None:
				url = next_page(link)
			else:
				url = None

			# No caso de erros
			if 'message' in data and 'Not Found' == data['message']:			
				return data

			prog = tag_regex(tags)

			# Trabalha no retorno da busca do GH
			for issue in data:
				if (prog.search(str(issue['labels'])) is not None and 'pull_request' not in issue) :
					created_at = issue['created_at']
					closed_at = issue['closed_at']

					dateCreated = datetime.strptime(created_at, '%Y-%m-%dT%H:%M:%SZ')
					dateClosed = datetime.strptime(closed_at, '%Y-%m-%dT%H:%M:%SZ')
					dateClosedFormated = dateClosed.strftime("%Y-%m-%d")

					delta = dateClosed - dateCreated
					if dateClosed <= toDateObj and dateClosed >= fromDateObjAvg:
						#LEADTIME-AVG
						ltAvgHelper[dateClosedFormated].append(delta.days)

						#THROUGHPUT-AVG
						days = thrAvgHelper[dateClosedFormated][0]
						days = days + 1
						thrAvgHelper[dateClosedFormated][0] = days
						for idTag, tag in enumerate(tags):
							for label in issue['labels']:
								if (label['name']==tag):
									days = thrAvgHelper[dateClosedFormated][1][idTag]
									days = days + 1
									thrAvgHelper[dateClosedFormated][1][idTag] = days

					if dateClosed <= toDateObj and dateClosed >= fromDateObj:
						#LEADTIME
						leadtime[dateClosedFormated].append([issue['number'], delta.days])

						#THROUGHPUT
						days = throughput[dateClosedFormated][1]
						days = days + 1
						throughput[dateClosedFormated][1] = days

		# Calcula as médias
		keysSorted = thrAvgHelper.keys()
		keysSorted.sort()

		# Média de throughput
		avg = []
		for x in range(0, len(keysSorted)):
			avg.append(thrAvgHelper[keysSorted[x]][0])
			if x >= (average-1):
				throughput[keysSorted[x]][0] = [mean(avg), stddev(avg)]
				del avg[0]

		for z in range(0, len(tags)):
			avg = []
			for x in range(0, len(keysSorted)):
				avg.append(thrAvgHelper[keysSorted[x]][1][z])
				if x >= (average-1):
					throughput[keysSorted[x]][2][z] = mean(avg)
					del avg[0]

		keysSorted = ltAvgHelper.keys()
		keysSorted.sort()

		# Media de Leadtime
		avg = []
		for x in range(0, len(keysSorted)):
			avg.append(ltAvgHelper[keysSorted[x]])
			if x >= (average - 1):
				avgHlp = []
				for y in range(0, average):
					avgHlp += avg[y]
				
				leadtime[keysSorted[x]][0] = [mean(avgHlp), stddev(avgHlp)]
				del avg[0]

		return ret

	def get_apr(self):
	    url = 'https://api.github.com/repos/' + os.environ['gh_organization'] + '/' + self.ghrepo + '/contents/agl/apr'
	    response = requests.get(url, auth=(os.environ['user'], os.environ['pass']))
	    data = response.json()

	    return data

def tag_regex(tags):
	# Cria REGEX para busca das TAGS
	reg = ''
	for tag in tags:
		reg += '["|\']name["|\']: ["|\']' + tag + '["|\']|'
	prog = re.compile(reg[:-1])

	return prog

def next_page(link):
	matchObj = re.search( r'<.*?>; rel="next"', link , re.M|re.I|re.A )
	
	if matchObj:
		return matchObj.group().replace('<','').replace('>; rel="next"','')
	else:
		return None

def mean(data):
	"""Return the sample arithmetic mean of data."""
	n = len(data)
	if n < 1:
		return None
	return sum(data)/float(n)

def _ss(data):
	"""Return sum of square deviations of sequence data."""
	c = mean(data)
	ss = sum((x-c)**2 for x in data)
	return ss

def stddev(data, ddof=0):
	"""Calculates the population standard deviation
	by default; specify ddof=1 to compute the sample
	standard deviation."""
	n = len(data)
	if n < 2:
		return None
	ss = _ss(data)
	pvar = ss/(n-ddof)
	return pvar**0.5