1 - En terminal 1: node server.js --p 8081 --m FORK En terminal 2: artillery quick --count 50 -n 10 "http://localhost:8081/info" > result_fork.txt

2 - Agrego un console.log en ruta /info

En terminal 1: node server.js --p 8081 --m FORK En terminal 2: artillery quick --count 50 -n 10 "http://localhost:8081/info" > result_fork_consolelog.txt

3 - En terminal 1: node --prof server.js --p 8081 --m FORK En directorio del desafío: curl -X GET "http://localhost:8081/info" En terminal 2: artillery quick --count 50 -n 10 "http://localhost:8081/info" > result_fork_curl.txt Renombro archivo: isolate-0000018F57F86560-2548-v8.log Como archivo: isolate-0000020E231EBA20-8356-v8.log node --prof-process isolate-Fork-SinConsoleLog.log > result-prof-fork.txt

4 - Agrego un console.log en ruta /info En terminal 1: node --prof-process server.js --p 8081 --m FORK En directorio del desafío: curl -X GET "http://localhost:8081/info" En terminal 2: artillery quick --count 50 -n 10 "http://localhost:8081/info-log" > result_fork_curl_consolelog.txt node --prof-process isolate-0000022E05CDBFD0-12912-v8.log > result-prof-fork-consolelog.txt